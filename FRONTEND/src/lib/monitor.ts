// ─────────────────────────────────────────────────────────────────────────────
// Real-time wallet monitor (SIH26183) — quota-safe by construction.
//
// The stakeholder asked for the console to be "fully realtime" but "must not
// burn my api keys". Those two pull in opposite directions, and the resolution
// is the same one blockchain.ts already documents for `probeSeedActivity`:
//
//   • A background loop asks the CHEAP question — "has anything moved?" — with
//     ~2 provider calls per watched address (a timestamp comparison, immune to
//     the breadth-cap false positives a hash-set diff would raise).
//   • Only when the answer is YES does it pay for the EXPENSIVE walk
//     (`traceWallet`, ≤40 wallets) — once — and raise an alert.
//   • The browser never polls the chain. It holds one SSE connection and
//     receives alerts the instant the server detects movement.
//
// Every provider call still flows through blockchain.ts's `throttled()` gate and
// its per-lane DAILY_BUDGET, so this layer can only ever spend within that
// ceiling; when a lane is exhausted the probe throws and we back off. With no
// keys configured the loop idles (there is nothing to poll) and the UI says so —
// no fabricated alerts, consistent with the app's honesty discipline.
//
// Server-only. Imported exclusively by the /api/monitor* route handlers; it must
// never be pulled into a client bundle (it reaches the network and holds live
// process state). No module-load side effects — the loop starts lazily on the
// first monitor API hit, so `next build` never spins it up.
// ─────────────────────────────────────────────────────────────────────────────

import type { Chain } from "@/lib/domain";
import { detectChain } from "@/lib/domain";
import {
  probeSeedActivity,
  traceWallet,
  quotaSnapshot,
  hasLiveProviders,
} from "@/lib/blockchain";
import { canonAddr } from "@/lib/ml-service";

// ── Tunables (env-overridable, all clamped) ──────────────────────────────────
function envInt(name: string, def: number, min: number, max: number): number {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw)) return def;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}
/** Gap between loop ticks. 60s default; never faster than 30s (quota guard). */
function pollMs(): number {
  return envInt("MONITOR_POLL_MS", 60_000, 30_000, 600_000);
}
/** How many watches to probe per tick — staggers cost across the watchlist. */
function maxProbesPerTick(): number {
  return envInt("MONITOR_MAX_PROBES_PER_TICK", 5, 1, 25);
}
/** Ceiling on watched addresses — bounds worst-case daily probe spend. */
function maxWatches(): number {
  return envInt("MONITOR_MAX_WATCHES", 25, 1, 200);
}
/** Hop depth for the escalation trace. Shallower than a manual trace to stay
 *  quota-lean; the wallet cap in blockchain.ts bounds it regardless. */
function traceHops(): number {
  return envInt("MONITOR_TRACE_HOPS", 4, 1, 5);
}
/** Kill switch. Set MONITOR_ENABLED=false to keep the loop dormant entirely. */
function monitorEnabled(): boolean {
  return (process.env.MONITOR_ENABLED ?? "true").toLowerCase() !== "false";
}
// After a lane reports its daily budget exhausted, stop probing for this long so
// we do not hammer a spent key. The DAILY_BUDGET rolls over at midnight anyway.
const BUDGET_BACKOFF_MS = 15 * 60_000;
const MAX_CONSECUTIVE_ERRORS = 5; // then auto-pause that watch
const ALERT_RING = 100; // most recent alerts retained in memory
const HASH_SAMPLE = 20; // recent tx hashes kept per watch for "new" detection
const NEW_HASHES_CAP = 10; // new hashes attached to an alert

// ── Public shapes ────────────────────────────────────────────────────────────
export type WatchStatus =
  | "pending" // added, baseline not yet taken
  | "quiet" // baseline taken, no new movement since
  | "activity" // movement detected on the last check
  | "degraded" // provider returned a partial/failed answer
  | "budget" // a provider lane is out of daily quota
  | "error"; // repeated probe failure

export type WatchStatePublic = {
  key: string;
  seed: string;
  chain: Chain;
  label?: string;
  caseRef?: string;
  addedAt: number;
  addedBy: string;
  lastCheckedAt: number;
  lastLatestTs: number;
  status: WatchStatus;
  lastError?: string;
  checks: number;
  alerts: number;
  paused: boolean;
};

export type AlertSeverity = "info" | "watch" | "elevated" | "critical";

export type MonitorAlert = {
  id: string;
  at: number;
  key: string;
  seed: string;
  chain: Chain;
  severity: AlertSeverity;
  title: string;
  detail: string;
  newTxCount: number;
  txHashes: string[];
  valueUsd: number;
  topRisk: { address: string; label: string; risk_score: number; risk_band: string } | null;
  vasp: { name: string; verified: boolean } | null;
  degraded: boolean;
  source: "live" | "mock";
};

export type MonitorSnapshot = {
  running: boolean;
  enabled: boolean;
  providersLive: boolean;
  pollMs: number;
  maxWatches: number;
  quota: ReturnType<typeof quotaSnapshot>;
  watches: WatchStatePublic[];
  alerts: MonitorAlert[];
  generatedAt: number;
};

export type MonitorEvent =
  | { type: "snapshot"; data: MonitorSnapshot }
  | { type: "alert"; data: MonitorAlert }
  | { type: "watch"; data: WatchStatePublic }
  | {
      type: "tick";
      data: { at: number; quota: ReturnType<typeof quotaSnapshot>; running: boolean; providersLive: boolean };
    };

type MonitorListener = (evt: MonitorEvent) => void;

// ── Internal watch record (superset of the public one) ───────────────────────
type WatchState = WatchStatePublic & {
  lastHashes: string[];
  consecutiveErrors: number;
};

function toPublic(w: WatchState): WatchStatePublic {
  const { lastHashes: _hashes, consecutiveErrors: _errs, ...pub } = w;
  return pub;
}

// ── The engine ────────────────────────────────────────────────────────────────
class Monitor {
  private watches = new Map<string, WatchState>();
  private alerts: MonitorAlert[] = [];
  private listeners = new Set<MonitorListener>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private budgetPausedUntil = 0;
  private seq = 0;

  // ── lifecycle ──
  /** Idempotent: starts the background loop if enabled and not already running. */
  ensureStarted(): void {
    if (this.running || !monitorEnabled()) return;
    this.running = true;
    // First tick on a short delay so the request that started us returns fast.
    this.timer = setTimeout(() => void this.tick(), 1_500);
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  // ── subscription (SSE) ──
  subscribe(fn: MonitorListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(evt: MonitorEvent): void {
    for (const fn of this.listeners) {
      try {
        fn(evt);
      } catch {
        // a broken subscriber must never break the loop or its siblings
      }
    }
  }

  // ── watchlist mutations ──
  addWatch(input: { seed: string; label?: string; caseRef?: string; addedBy: string }):
    | { ok: true; watch: WatchStatePublic }
    | { ok: false; error: string } {
    const seed = (input.seed || "").trim();
    if (!seed) return { ok: false, error: "An address is required." };
    const chain = detectChain(seed);
    if (!chain) return { ok: false, error: "Unrecognised address format — cannot detect its chain." };

    const key = `${chain}:${canonAddr(seed)}`;
    const existing = this.watches.get(key);
    if (existing) return { ok: true, watch: toPublic(existing) };
    if (this.watches.size >= maxWatches()) {
      return { ok: false, error: `Watchlist is full (${maxWatches()} addresses max).` };
    }

    const now = Date.now();
    const w: WatchState = {
      key,
      seed,
      chain,
      label: input.label?.trim() || undefined,
      caseRef: input.caseRef?.trim() || undefined,
      addedAt: now,
      addedBy: input.addedBy,
      lastCheckedAt: 0,
      lastLatestTs: 0,
      status: "pending",
      checks: 0,
      alerts: 0,
      paused: false,
      lastHashes: [],
      consecutiveErrors: 0,
    };
    this.watches.set(key, w);
    this.ensureStarted();
    this.emit({ type: "watch", data: toPublic(w) });
    return { ok: true, watch: toPublic(w) };
  }

  removeWatch(key: string): boolean {
    return this.watches.delete(key);
  }

  setPaused(key: string, paused: boolean): boolean {
    const w = this.watches.get(key);
    if (!w) return false;
    w.paused = paused;
    if (!paused && w.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) w.consecutiveErrors = 0;
    this.emit({ type: "watch", data: toPublic(w) });
    return true;
  }

  // ── snapshot ──
  snapshot(): MonitorSnapshot {
    return {
      running: this.running,
      enabled: monitorEnabled(),
      providersLive: hasLiveProviders(),
      pollMs: pollMs(),
      maxWatches: maxWatches(),
      quota: quotaSnapshot(),
      watches: Array.from(this.watches.values()).map(toPublic),
      alerts: this.alerts.slice(0, ALERT_RING),
      generatedAt: Date.now(),
    };
  }

  // ── the loop ──
  private async tick(): Promise<void> {
    if (!this.running) return;
    try {
      const now = Date.now();
      const canProbe = hasLiveProviders() && now >= this.budgetPausedUntil;
      if (canProbe) {
        const due = this.pickDue();
        for (const w of due) {
          if (!this.running) break;
          await this.checkWatch(w);
        }
      }
      this.emit({
        type: "tick",
        data: { at: now, quota: quotaSnapshot(), running: this.running, providersLive: hasLiveProviders() },
      });
    } catch {
      // never let a tick throw and kill the loop
    } finally {
      if (this.running) this.timer = setTimeout(() => void this.tick(), pollMs());
    }
  }

  /** Active watches, least-recently-checked first, capped for stagger. */
  private pickDue(): WatchState[] {
    return Array.from(this.watches.values())
      .filter((w) => !w.paused)
      .sort((a, b) => a.lastCheckedAt - b.lastCheckedAt)
      .slice(0, maxProbesPerTick());
  }

  private async checkWatch(w: WatchState): Promise<void> {
    w.lastCheckedAt = Date.now();
    w.checks++;
    try {
      const probe = await probeSeedActivity(w.seed, w.chain);
      w.consecutiveErrors = 0;

      if (probe.degraded) {
        w.status = "degraded";
        w.lastError = probe.warnings[0] ?? "Provider returned a partial answer.";
        this.emit({ type: "watch", data: toPublic(w) });
        return;
      }
      w.lastError = undefined;

      const isBaseline = w.lastLatestTs === 0;
      if (isBaseline) {
        // Establish the reference point WITHOUT a full trace. Adding an address
        // must not itself trigger the expensive walk — only genuinely newer
        // activity than this baseline does.
        w.lastLatestTs = probe.latestTs;
        w.lastHashes = probe.hashes.slice(0, HASH_SAMPLE);
        w.status = "quiet";
        this.emit({ type: "watch", data: toPublic(w) });
        return;
      }

      if (probe.latestTs > w.lastLatestTs) {
        const newHashes = probe.hashes.filter((h) => !w.lastHashes.includes(h)).slice(0, NEW_HASHES_CAP);
        w.lastLatestTs = probe.latestTs;
        w.lastHashes = probe.hashes.slice(0, HASH_SAMPLE);
        w.status = "activity";
        w.alerts++;
        this.emit({ type: "watch", data: toPublic(w) });
        await this.escalate(w, newHashes); // the one expensive call, only on movement
      } else {
        w.status = "quiet";
        this.emit({ type: "watch", data: toPublic(w) });
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "BudgetExhausted") {
        w.status = "budget";
        w.lastError = "Provider daily quota exhausted — monitoring paused until it resets.";
        this.budgetPausedUntil = Date.now() + BUDGET_BACKOFF_MS;
      } else {
        w.consecutiveErrors++;
        w.status = "error";
        w.lastError = err instanceof Error ? err.message : String(err);
        if (w.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          w.paused = true;
          w.lastError = `Auto-paused after ${MAX_CONSECUTIVE_ERRORS} consecutive errors: ${w.lastError}`;
        }
      }
      this.emit({ type: "watch", data: toPublic(w) });
    }
  }

  /** Movement detected → walk the money once and raise an alert. */
  private async escalate(w: WatchState, newHashes: string[]): Promise<void> {
    try {
      const trace = await traceWallet(w.seed, { maxHops: traceHops() });
      const seedKey = canonAddr(w.seed);

      // Highest-risk wallet on the trail (excluding the seed itself), for triage.
      let topRisk: MonitorAlert["topRisk"] = null;
      for (const n of trace.nodes) {
        if (canonAddr(n.address) === seedKey) continue;
        if (!topRisk || n.risk_score > topRisk.risk_score) {
          topRisk = { address: n.address, label: n.label, risk_score: n.risk_score, risk_band: n.risk_band };
        }
      }

      // A verified (non-mixer) VASP anywhere on the trail = an actionable cash-out.
      const vaspNode = trace.nodes.find((n) => n.vasp_attribution?.is_verified && !n.vasp_attribution?.is_mixer);
      const vasp = vaspNode?.vasp_attribution
        ? { name: vaspNode.vasp_attribution.vasp_name, verified: true }
        : null;

      // Value of the new movement: transfers matching the new hashes, else the
      // total fresh outflow from the seed on this trace.
      const hashSet = new Set(newHashes);
      let valueUsd = trace.transfers
        .filter((t) => hashSet.has(t.tx_hash))
        .reduce((s, t) => s + (t.value_usd || 0), 0);
      if (valueUsd === 0) {
        valueUsd = trace.transfers
          .filter((t) => canonAddr(t.from_address) === seedKey)
          .reduce((s, t) => s + (t.value_usd || 0), 0);
      }

      const severity = this.severityFor(topRisk?.risk_score ?? 0, Boolean(vasp), trace.degraded ?? false);
      const alert: MonitorAlert = {
        id: `alert_${Date.now()}_${++this.seq}`,
        at: Date.now(),
        key: w.key,
        seed: w.seed,
        chain: w.chain,
        severity,
        title: vasp
          ? `Funds reached ${vasp.name} — cash-out point identified`
          : `New movement detected on ${shortAddr(w.seed)}`,
        detail: this.describe(w, newHashes.length, valueUsd, topRisk, vasp, trace.source),
        newTxCount: newHashes.length,
        txHashes: newHashes,
        valueUsd,
        topRisk,
        vasp,
        degraded: trace.degraded ?? false,
        source: trace.source,
      };
      this.pushAlert(alert);
    } catch (err) {
      // Escalation failed (budget hit mid-walk, provider error). Still tell the
      // operator movement was seen — just without the enriched trail.
      const name = err instanceof Error ? err.name : "";
      if (name === "BudgetExhausted") this.budgetPausedUntil = Date.now() + BUDGET_BACKOFF_MS;
      const alert: MonitorAlert = {
        id: `alert_${Date.now()}_${++this.seq}`,
        at: Date.now(),
        key: w.key,
        seed: w.seed,
        chain: w.chain,
        severity: "watch",
        title: `New movement detected on ${shortAddr(w.seed)}`,
        detail:
          "The seed address moved funds, but the follow-up trace could not complete " +
          (name === "BudgetExhausted" ? "(provider quota exhausted). " : "(provider error). ") +
          "Open a manual Wallet Trace to walk the trail.",
        newTxCount: newHashes.length,
        txHashes: newHashes,
        valueUsd: 0,
        topRisk: null,
        vasp: null,
        degraded: true,
        source: "live",
      };
      this.pushAlert(alert);
    }
  }

  private severityFor(topRisk: number, reachedVasp: boolean, degraded: boolean): AlertSeverity {
    let level: AlertSeverity =
      topRisk >= 80 ? "critical" : topRisk >= 60 ? "elevated" : topRisk >= 40 ? "watch" : "info";
    // Reaching a KYC-bound exchange is the actionable moment — bump one notch.
    if (reachedVasp) {
      const order: AlertSeverity[] = ["info", "watch", "elevated", "critical"];
      level = order[Math.min(order.length - 1, order.indexOf(level) + 1)];
    }
    if (degraded && level === "info") level = "watch";
    return level;
  }

  private describe(
    w: WatchState,
    newTx: number,
    valueUsd: number,
    topRisk: MonitorAlert["topRisk"],
    vasp: MonitorAlert["vasp"],
    source: "live" | "mock"
  ): string {
    const parts: string[] = [];
    parts.push(`${newTx || "New"} transfer${newTx === 1 ? "" : "s"} on ${w.chain}.`);
    if (valueUsd > 0) parts.push(`≈ $${Math.round(valueUsd).toLocaleString("en-US")} moved.`);
    if (vasp) parts.push(`Trail reaches ${vasp.name} (verified VASP) — freeze window open.`);
    if (topRisk && topRisk.risk_score >= 40) {
      parts.push(`Highest-risk hop: ${shortAddr(topRisk.address)} (${topRisk.risk_band}, ${topRisk.risk_score}).`);
    }
    if (source === "mock") parts.push("(Follow-up trace used the offline dataset.)");
    return parts.join(" ");
  }

  private pushAlert(alert: MonitorAlert): void {
    this.alerts.unshift(alert);
    if (this.alerts.length > ALERT_RING) this.alerts.length = ALERT_RING;
    this.emit({ type: "alert", data: alert });
  }
}

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

// ── Singleton, HMR-safe ───────────────────────────────────────────────────────
// Next.js dev reloads re-evaluate modules; stashing the instance on globalThis
// means one loop survives across reloads instead of leaking a new timer each time.
const GLOBAL_KEY = "__interceptors_monitor__";
type GlobalWithMonitor = typeof globalThis & { [GLOBAL_KEY]?: Monitor };

export function getMonitor(): Monitor {
  const g = globalThis as GlobalWithMonitor;
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Monitor();
  return g[GLOBAL_KEY]!;
}
