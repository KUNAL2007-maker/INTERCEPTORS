"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Page, Card, PanelHeader } from "../ui/Page";
import { useAuth } from "../AuthProvider";
import { shortWallet, chainColor, type Chain } from "@/lib/domain";
import type {
  MonitorSnapshot,
  MonitorAlert,
  WatchStatePublic,
  WatchStatus,
  AlertSeverity,
} from "@/lib/monitor";

// The Monitor view holds ONE EventSource open to /api/monitor/stream and renders
// whatever the server pushes. It deliberately never polls the chain itself — the
// server's cheap probe loop does that within the provider budget, and this screen
// only reacts. Adding/removing a watch is a POST; everything else arrives over SSE.

type ConnState = "connecting" | "live" | "offline";

const SEV_STYLE: Record<AlertSeverity, { chip: string; dot: string }> = {
  critical: { chip: "text-rose-300 border-rose-500/40 bg-rose-500/10", dot: "bg-rose-400" },
  elevated: { chip: "text-orange-300 border-orange-500/40 bg-orange-500/10", dot: "bg-orange-400" },
  watch: { chip: "text-amber-300 border-amber-500/40 bg-amber-500/10", dot: "bg-amber-400" },
  info: { chip: "text-sky-300 border-sky-500/40 bg-sky-500/10", dot: "bg-sky-400" },
};

const STATUS_STYLE: Record<WatchStatus, { label: string; chip: string }> = {
  pending: { label: "Baseline…", chip: "text-slate-300 border-slate-500/40 bg-slate-500/10" },
  quiet: { label: "All clear", chip: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
  activity: { label: "Movement", chip: "text-rose-300 border-rose-500/40 bg-rose-500/10" },
  degraded: { label: "Degraded", chip: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
  budget: { label: "Quota hit", chip: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
  error: { label: "Error", chip: "text-rose-300 border-rose-500/40 bg-rose-500/10" },
};

function usd(v: number): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}

function ago(ts: number): string {
  if (!ts) return "never";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

export function MonitorView() {
  const { user } = useAuth();
  const [snap, setSnap] = useState<MonitorSnapshot | null>(null);
  const [watches, setWatches] = useState<WatchStatePublic[]>([]);
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);
  const [conn, setConn] = useState<ConnState>("connecting");
  const [seed, setSeed] = useState("");
  const [label, setLabel] = useState("");
  const [caseRef, setCaseRef] = useState("");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const [nowTick, setNowTick] = useState(0); // forces "Xs ago" labels to refresh

  const applySnapshot = useCallback((s: MonitorSnapshot) => {
    setSnap(s);
    setWatches(s.watches);
    setAlerts(s.alerts);
  }, []);

  // Re-render the relative timestamps every 5s without touching the server.
  useEffect(() => {
    const id = setInterval(() => setNowTick((n) => n + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  // One SSE connection for the lifetime of the view.
  useEffect(() => {
    setConn("connecting");
    const es = new EventSource("/api/monitor/stream");
    esRef.current = es;

    es.onopen = () => setConn("live");
    es.onerror = () => setConn((c) => (c === "live" ? "offline" : "connecting"));

    es.addEventListener("snapshot", (e) => {
      try {
        applySnapshot(JSON.parse((e as MessageEvent).data) as MonitorSnapshot);
        setConn("live");
      } catch {
        /* ignore malformed frame */
      }
    });
    es.addEventListener("alert", (e) => {
      try {
        const a = JSON.parse((e as MessageEvent).data) as MonitorAlert;
        setAlerts((prev) => [a, ...prev].slice(0, 100));
      } catch {
        /* ignore */
      }
    });
    es.addEventListener("watch", (e) => {
      try {
        const w = JSON.parse((e as MessageEvent).data) as WatchStatePublic;
        setWatches((prev) => {
          const i = prev.findIndex((x) => x.key === w.key);
          if (i === -1) return [...prev, w];
          const next = prev.slice();
          next[i] = w;
          return next;
        });
      } catch {
        /* ignore */
      }
    });
    es.addEventListener("tick", (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data) as {
          quota: MonitorSnapshot["quota"];
          running: boolean;
          providersLive: boolean;
        };
        setSnap((prev) => (prev ? { ...prev, quota: d.quota, running: d.running, providersLive: d.providersLive } : prev));
      } catch {
        /* ignore */
      }
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [applySnapshot]);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}).`);
    if (data?.snapshot) applySnapshot(data.snapshot as MonitorSnapshot);
    return data;
  }, [applySnapshot]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seed.trim()) return;
    setAdding(true);
    setFormError(null);
    try {
      await post({ action: "add", seed: seed.trim(), label: label.trim() || undefined, caseRef: caseRef.trim() || undefined });
      setSeed("");
      setLabel("");
      setCaseRef("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not add the address.");
    } finally {
      setAdding(false);
    }
  };

  const remove = (key: string) => void post({ action: "remove", key }).catch(() => {});
  const toggle = (w: WatchStatePublic) =>
    void post({ action: w.paused ? "resume" : "pause", key: w.key }).catch(() => {});

  const providersLive = snap?.providersLive ?? false;
  const activeAlerts = alerts.length;
  const movingNow = watches.filter((w) => w.status === "activity").length;

  return (
    <Page width="wide">
      {/* Header: live status + posture */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Real-time surveillance
          </div>
          <h1 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-strong)" }}>
            Live Wallet Monitor
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ConnBadge conn={conn} />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              providersLive
                ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                : "text-slate-300 border-slate-500/40 bg-slate-500/10"
            }`}
          >
            {providersLive ? "Providers live" : "Demo mode (no keys)"}
          </span>
        </div>
      </div>

      {/* Honest posture banner */}
      {!providersLive && (
        <div
          className="mb-4 rounded-xl border px-4 py-3 text-[12px]"
          style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", color: "#fcd9a3" }}
        >
          No blockchain provider key is configured, so the monitor is idle — watched addresses are stored but not
          polled. Set <span className="font-mono">ALCHEMY_API_KEY</span> (EVM) or{" "}
          <span className="font-mono">TRONGRID_API_KEY</span> (TRON) to activate live monitoring. No alerts are
          fabricated in demo mode.
        </div>
      )}

      {/* KPI strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Watched addresses" value={String(watches.length)} sub={`${snap?.maxWatches ?? 25} max`} />
        <Kpi label="Moving now" value={String(movingNow)} sub="new activity detected" tone={movingNow ? "rose" : "muted"} />
        <Kpi label="Alerts (session)" value={String(activeAlerts)} sub="most recent 100 retained" tone={activeAlerts ? "amber" : "muted"} />
        <Kpi
          label="Poll cadence"
          value={snap ? `${Math.round(snap.pollMs / 1000)}s` : "—"}
          sub={snap?.running ? "loop running" : "idle"}
          tone={snap?.running ? "cyan" : "muted"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Left column: add + watchlist + quota */}
        <div className="flex flex-col gap-4">
          <Card>
            <PanelHeader eyebrow="Add to watchlist" title="Watch a suspect address" />
            <form onSubmit={onAdd} className="mt-3 flex flex-col gap-2.5">
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="0x… / T… / bc1… — victim-reported address"
                className="w-full rounded-lg border bg-transparent px-3 py-2 font-mono text-[12px] outline-none focus:border-cyan-500/60"
                style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
                spellCheck={false}
                autoComplete="off"
              />
              <div className="flex gap-2">
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-[12px] outline-none focus:border-cyan-500/60"
                  style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
                />
                <input
                  value={caseRef}
                  onChange={(e) => setCaseRef(e.target.value)}
                  placeholder="NCRP / case #"
                  className="w-[140px] rounded-lg border bg-transparent px-3 py-2 text-[12px] outline-none focus:border-cyan-500/60"
                  style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
                />
              </div>
              {formError && <div className="text-[11px] text-rose-400">{formError}</div>}
              <button
                type="submit"
                disabled={adding || !seed.trim()}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-[12px] font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-40"
              >
                {adding ? "Adding…" : "Add to watchlist"}
              </button>
            </form>
          </Card>

          <Card>
            <PanelHeader
              eyebrow="Watchlist"
              title={`${watches.length} address${watches.length === 1 ? "" : "es"} under watch`}
            />
            <div className="mt-3 flex flex-col gap-2">
              {watches.length === 0 && (
                <div className="rounded-lg border border-dashed py-6 text-center text-[12px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  No addresses watched yet. Add a seed above to begin monitoring.
                </div>
              )}
              {watches
                .slice()
                .sort((a, b) => a.addedAt - b.addedAt)
                .map((w) => (
                  <WatchRow key={w.key} w={w} onRemove={() => remove(w.key)} onToggle={() => toggle(w)} />
                ))}
            </div>
          </Card>

          {snap && (
            <Card>
              <PanelHeader eyebrow="Provider budget" title="Daily quota used" />
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <QuotaRow name="Alchemy (EVM)" v={snap.quota.alchemy} />
                <QuotaRow name="TronGrid" v={snap.quota.trongrid} />
                <QuotaRow name="Etherscan" v={snap.quota.etherscan} />
                <QuotaRow name="mempool.space" v={snap.quota.mempool} />
              </div>
              <div className="mt-2 text-[10px]" style={{ color: "var(--muted-2)" }}>
                Probes cost ~2 calls each; a full trace runs only when an address actually moves funds.
              </div>
            </Card>
          )}
        </div>

        {/* Right column: live alert feed */}
        <Card className="min-h-[420px]">
          <PanelHeader
            eyebrow="Live feed"
            title="Alerts"
            right={
              <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                {user?.name ? `Watching as ${user.name}` : null}
              </span>
            }
          />
          <div className="mt-3 flex flex-col gap-2.5">
            {alerts.length === 0 && (
              <div className="rounded-lg border border-dashed py-12 text-center text-[12px]" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                {providersLive
                  ? "No movement yet. Alerts appear here the moment a watched address moves funds."
                  : "Monitoring is idle in demo mode — no alerts will be raised until a provider key is set."}
              </div>
            )}
            {alerts.map((a) => (
              <AlertCard key={a.id} a={a} />
            ))}
          </div>
        </Card>
      </div>
      <span className="sr-only">{nowTick}</span>
    </Page>
  );
}

function ConnBadge({ conn }: { conn: ConnState }) {
  const map: Record<ConnState, { label: string; chip: string; pulse: boolean }> = {
    connecting: { label: "Connecting…", chip: "text-slate-300 border-slate-500/40 bg-slate-500/10", pulse: false },
    live: { label: "Live", chip: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10", pulse: true },
    offline: { label: "Reconnecting…", chip: "text-amber-300 border-amber-500/40 bg-amber-500/10", pulse: false },
  };
  const s = map[conn];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${s.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${conn === "live" ? "bg-emerald-400" : conn === "offline" ? "bg-amber-400" : "bg-slate-400"} ${s.pulse ? "animate-pulse" : ""}`} />
      {s.label}
    </span>
  );
}

function Kpi({ label, value, sub, tone = "muted" }: { label: string; value: string; sub?: string; tone?: "muted" | "rose" | "amber" | "cyan" }) {
  const color = tone === "rose" ? "#fb7185" : tone === "amber" ? "#fbbf24" : tone === "cyan" ? "#22d3ee" : "var(--text-strong)";
  return (
    <div className="rounded-xl border p-3" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="mt-1 text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px]" style={{ color: "var(--muted-2)" }}>{sub}</div>}
    </div>
  );
}

function QuotaRow({ name, v }: { name: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-2.5 py-1.5" style={{ borderColor: "var(--border)" }}>
      <span style={{ color: "var(--muted)" }}>{name}</span>
      <span className="font-mono" style={{ color: "var(--text-strong)" }}>{v}</span>
    </div>
  );
}

function ChainDot({ chain }: { chain: Chain }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: chainColor(chain) }} />;
}

function WatchRow({ w, onRemove, onToggle }: { w: WatchStatePublic; onRemove: () => void; onToggle: () => void }) {
  const st = STATUS_STYLE[w.status];
  return (
    <div className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ChainDot chain={w.chain} />
          <span className="truncate font-mono text-[12px]" style={{ color: "var(--text-strong)" }}>
            {w.label || shortWallet(w.seed)}
          </span>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.chip}`}>{st.label}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px]" style={{ color: "var(--muted-2)" }}>
        <span className="truncate font-mono">{shortWallet(w.seed)}{w.caseRef ? ` · ${w.caseRef}` : ""}</span>
        <span>{w.checks} checks · {w.alerts} alerts · {ago(w.lastCheckedAt)}</span>
      </div>
      {w.lastError && <div className="mt-1 truncate text-[10px] text-amber-400/90" title={w.lastError}>{w.lastError}</div>}
      <div className="mt-2 flex gap-2">
        <button onClick={onToggle} className="rounded-md border px-2 py-1 text-[10px] font-medium transition hover:bg-white/5" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          {w.paused ? "Resume" : "Pause"}
        </button>
        <button onClick={onRemove} className="rounded-md border border-rose-500/30 px-2 py-1 text-[10px] font-medium text-rose-300/90 transition hover:bg-rose-500/10">
          Remove
        </button>
      </div>
    </div>
  );
}

function AlertCard({ a }: { a: MonitorAlert }) {
  const sev = SEV_STYLE[a.severity];
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${sev.dot}`} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold" style={{ color: "var(--text-strong)" }}>{a.title}</div>
            <div className="mt-0.5 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>{a.detail}</div>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sev.chip}`}>
          {a.severity}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]" style={{ color: "var(--muted-2)" }}>
        <span className="inline-flex items-center gap-1"><ChainDot chain={a.chain} /> {a.chain}</span>
        <span className="font-mono">{shortWallet(a.seed)}</span>
        {a.valueUsd > 0 && <span>Value <span className="font-mono text-white/90">{usd(a.valueUsd)}</span></span>}
        {a.vasp && <span className="text-emerald-300/90">→ {a.vasp.name}</span>}
        {a.topRisk && a.topRisk.risk_score >= 40 && (
          <span>Top risk <span className="font-mono">{shortWallet(a.topRisk.address)}</span> ({a.topRisk.risk_score})</span>
        )}
        {a.degraded && <span className="text-amber-400/90">degraded</span>}
        <span className="ml-auto">{ago(a.at)}</span>
      </div>
    </div>
  );
}
