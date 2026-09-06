"use client";

import { useMemo, useState } from "react";
import { MetricCard } from "../ui/MetricCard";
import { SeverityBadge } from "../ui/SeverityBadge";
import { Page, PanelHeader } from "../ui/Page";
import {
  AGENT_META,
  formatUSD,
  shortWallet,
  severityColor,
  type Severity,
  type ChatAgent,
  type WalletTransfer,
} from "@/lib/domain";
import type { CryptoFinding, TrackDecision } from "@/lib/investigation";
import { useTraceStats, useFindings, useTransfers, useTraceStore } from "@/lib/store";

// Decorative sparklines — the KPI trend curves, kept verbatim from FinGuard so
// the cards read the same. They illustrate a trend, not a live metric.
const spark1 = [12, 14, 13, 18, 17, 22, 24, 21, 27, 30, 28, 34];
const spark2 = [220, 234, 210, 255, 268, 260, 280, 305, 298, 320, 335, 348];
const spark3 = [3, 4, 3, 5, 6, 5, 6, 6, 7, 7, 7, 8];
const spark4 = [90, 88, 85, 82, 84, 81, 80, 78, 79, 78, 77, 78];

// The four I4C agents, in fleet order. Colour/icon/role come from AGENT_META;
// the load figures are illustrative (there is no real scheduler yet).
const FLEET: { agent: ChatAgent; load: number }[] = [
  { agent: "Chain Analyst", load: 62 },
  { agent: "Attribution Analyst", load: 74 },
  { agent: "Compliance Officer", load: 41 },
  { agent: "Investigating Officer", load: 55 },
];

// A colour per finding typology, mirroring the TYPOLOGIES palette in domain.ts.
const TYPOLOGY_COLOR: Record<string, string> = {
  "VASP-SWEEP": "#ef4444",
  "MIXER-TUMBLER-TOUCH": "#ec4899",
  "CROSS-CHAIN-BRIDGE": "#38bdf8",
  "PEELING-CHAIN": "#f59e0b",
  "THRESHOLD-SPLIT": "#22c55e",
  "MULTI-INPUT-CLUSTER": "#a78bfa",
  "DUST-TAINT": "#64748b",
};

// Feed groups, in the order the findings themselves are ranked.
const SEV_GROUPS: { key: CryptoFinding["severity"]; label: string; dot: string }[] = [
  { key: "high", label: "High severity", dot: "bg-red-500" },
  { key: "medium", label: "Medium severity", dot: "bg-amber-400" },
  { key: "info", label: "Informational", dot: "bg-emerald-400" },
];

import { useAuth } from "../AuthProvider";
import type { StoredCase } from "@/lib/db";
import { formatINR, detectChain, CHAINS, chainColor } from "@/lib/domain";

export function CommandDashboard({
  liveFeed,
  onGoToTrace,
  onGoToCases,
}: {
  liveFeed: boolean;
  onGoToTrace: () => void;
  onGoToCases?: () => void;
}) {
  const { user } = useAuth();
  const { wallets, highRisk, tracedUsd, openFindings } = useTraceStats();
  const { findings } = useFindings();
  const { transfers } = useTransfers();
  const { evidence, trace, cases, runTrace, setActiveCase } = useTraceStore();
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [tracingCase, setTracingCase] = useState<string | null>(null);
  const [forwardedMap, setForwardedMap] = useState<Record<string, boolean>>({});

  const canExecuteTrace =
    user?.role === "NORMAL_INVESTIGATOR" ||
    user?.role === "SENIOR_INVESTIGATOR" ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "WORKSPACE_ADMIN" ||
    Boolean(user?.is_gazetted);

  const handleTraceFromDashboard = async (c: StoredCase) => {
    if (!canExecuteTrace) {
      setForwardedMap((prev) => ({ ...prev, [c.case_number]: true }));
      return;
    }
    setTracingCase(c.case_number);
    try {
      setActiveCase(c);
      await runTrace(c.suspect_wallet_address, c);
      onGoToTrace?.();
    } catch {
      // Ignore
    } finally {
      setTracingCase(null);
    }
  };

  // Crypto transfers carry no severity of their own — derive it from the trace
  // nodes: a transfer inherits the severity of the wallet it landed in (or left).
  const sevByAddr = useMemo(() => {
    const m = new Map<string, Severity>();
    (trace?.nodes ?? []).forEach((n) => m.set(n.address, n.severity));
    return m;
  }, [trace]);

  const heat = useMemo(() => buildHeatmap(transfers, sevByAddr), [transfers, sevByAddr]);

  const typology = useMemo(() => {
    const rows = evidence?.typologies ?? [];
    const total = rows.reduce((s, r) => s + r.count, 0);
    return {
      total,
      rows: rows.map((r) => ({
        code: r.code,
        name: r.label,
        count: r.count,
        amount: r.amount,
        c: TYPOLOGY_COLOR[r.code] ?? "#64748b",
        pct: total ? Math.round((r.count / total) * 100) : 0,
      })),
    };
  }, [evidence]);

  // If no trace is active, show the incoming complaints inbox front and center
  if (!evidence || evidence.txCount === 0) {
    return (
      <Page width="wide">
        {/* Officer Welcome & Authority Banner */}
        <div
          className="rounded-2xl border p-5 mb-6 shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.04))",
            borderColor: "rgba(16, 185, 129, 0.25)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-md"
                style={{ background: "#10b981", color: "#000" }}
              >
                ⚖️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    Law Enforcement Command Console · NCRP Attribution Engine
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    {user?.role === "SUPER_ADMIN" ? "CENTRAL I4C OVERSIGHT" : user?.jurisdiction_code || "MH-CYBER-01"}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Logged in as <strong className="text-white">{user?.name}</strong> ({user?.role}) ·{" "}
                  {canExecuteTrace
                    ? "Authorized for Multi-Hop Cross-Chain Tracing & Case Attribution"
                    : "Field Investigator (Select complaint to investigate)"}
                </p>
              </div>
            </div>

            <button
              onClick={onGoToTrace}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow"
              style={{ background: "linear-gradient(135deg, #22c55e, #10b981)" }}
            >
              + Run Custom Seed Trace
            </button>
          </div>
        </div>

        {/* Incoming Victim Complaints Queue */}
        <div
          className="rounded-2xl border p-5 mb-6 shadow-md"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between gap-3 border-b pb-4 mb-4" style={{ borderColor: "var(--border)" }}>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold">Incoming Citizen Complaints</div>
              <h2 className="text-base font-bold text-white mt-0.5">NCRP 1930 Helpline Fraud Reports</h2>
              <p className="text-xs text-muted mt-0.5">
                Select any victim-reported suspect wallet below to execute automated multi-hop blockchain tracing.
              </p>
            </div>
            {onGoToCases && (
              <button
                onClick={onGoToCases}
                className="text-xs text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-xl transition"
              >
                View Full Inbox ({cases.length}) &rarr;
              </button>
            )}
          </div>

          <div className="space-y-3">
            {cases.map((c) => {
              const chain = detectChain(c.suspect_wallet_address);
              const isTracing = tracingCase === c.case_number;
              const isForwarded = forwardedMap[c.case_number];

              return (
                <div
                  key={c.case_number}
                  className="rounded-xl border p-4 transition hover:border-emerald-500/40 bg-white/[0.01] flex flex-wrap items-center justify-between gap-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <span className="font-mono font-bold text-xs text-white">{c.case_number}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {c.jurisdiction_code}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                          c.status === "PENDING_TRACING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                            : c.status === "TRACED"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {c.status}
                      </span>
                      {c.target_vasp && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          VASP: {c.target_vasp}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted flex items-center gap-3 flex-wrap">
                      <span>
                        Complainant: <strong className="text-white">{c.victim_name || "Rajesh Verma"}</strong>
                      </span>
                      <span>&bull;</span>
                      <span className="text-slate-300 font-medium">{c.crime_type}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-muted">Suspect:</span>
                      <code className="text-xs font-mono text-cyan-300 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        {c.suspect_wallet_address}
                      </code>
                      {chain && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono"
                          style={{
                            background: `${chainColor(chain)}22`,
                            color: chainColor(chain),
                          }}
                        >
                          {CHAINS[chain].short}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-rose-400 font-mono">
                      {formatINR(Number(c.loss_amount_inr))}
                    </div>
                    <div className="text-[10px] text-muted mb-2">
                      ~{Math.round(Number(c.loss_amount_inr) / 85).toLocaleString()} {c.token_symbol || "USDT"}
                    </div>

                    {canExecuteTrace ? (
                      <button
                        onClick={() => handleTraceFromDashboard(c)}
                        disabled={isTracing}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                        style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                      >
                        <span>⚡</span>
                        <span>{isTracing ? "Tracing..." : "Trace Suspect Wallet"}</span>
                      </button>
                    ) : (
                      !isForwarded ? (
                        <button
                          onClick={() => handleTraceFromDashboard(c)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition flex items-center gap-1.5 ml-auto"
                        >
                          <span>🔒</span>
                          <span>Forward to ACP Sharma</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                          ✓ Queued for ACP
                        </span>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Page>
    );
  }

  // Findings for the feed, tagged with a stable id and grouped by severity so
  // the sticky group headers behave like FinGuard's date buckets.
  const items = findings.map((f, i) => ({ f, id: `${f.code}-${i}` }));
  const feedGroups = SEV_GROUPS.map((g) => ({
    ...g,
    rows: items.filter((it) => it.f.severity === g.key),
  })).filter((g) => g.rows.length > 0);

  return (
    <Page>
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Wallets Traced"
          value={wallets.toLocaleString("en-US")}
          sub="Across this trace"
          accent="#a78bfa"
          spark={spark1}
          icon={<span className="text-[11px]">◈</span>}
          trend={{ dir: "up", text: `${evidence.txCount} transfers` }}
        />
        <MetricCard
          label="Value Traced"
          value={formatUSD(tracedUsd)}
          sub="Total on-chain value"
          accent="#22c55e"
          spark={spark2}
          icon={<span className="text-[11px]">$</span>}
          trend={{ dir: "up", text: `${highRisk} high-risk wallet${highRisk !== 1 ? "s" : ""}` }}
        />
        <MetricCard
          label="High-Risk Wallets"
          value={String(highRisk)}
          sub="Flagged for review"
          accent="#ef4444"
          spark={spark3}
          icon={<span className="text-[11px]">◉</span>}
          trend={{ dir: highRisk > 0 ? "up" : "flat", text: highRisk > 0 ? `${highRisk} need review` : "All clear" }}
        />
        <MetricCard
          label="Open Findings"
          value={String(openFindings)}
          sub="Detected typologies"
          accent="#38bdf8"
          spark={spark4}
          icon={<span className="text-[11px]">⚑</span>}
          trend={{ dir: openFindings > 0 ? "up" : "flat", text: openFindings > 0 ? `${openFindings} need attention` : "All clear" }}
        />
      </div>

      {/* Dual-track freeze decision — the headline risk banner */}
      <div className="mt-5">
        <TrackBanner track={evidence.track} />
      </div>

      {/* Active Traced Case Dossier Bar */}
      {trace && (
        <div
          className="mt-4 rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-2">
                <span>Active Traced Suspect Wallet:</span>
                <code className="text-cyan-300 font-mono bg-black/40 px-2 py-0.5 rounded text-xs">
                  {trace.seed}
                </code>
              </div>
              <div className="text-[11px] text-muted mt-0.5">
                Linked Case: <strong className="text-slate-300">{evidence.case?.ncrp_ack_no || "MH-CYBER-2026-0842"}</strong>
                {evidence.case?.victim_name ? ` · Complainant: ${evidence.case.victim_name}` : ""}
                {evidence.case?.amount_lost_inr ? ` · Loss: ${formatINR(evidence.case.amount_lost_inr)}` : ""}
              </div>
            </div>
          </div>

          {onGoToCases && (
            <button
              onClick={onGoToCases}
              className="text-xs text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition"
            >
              Switch / View Other Cases &rarr;
            </button>
          )}
        </div>
      )}

      {/* Middle strip — 2 panels */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 border" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <PanelHeader
            eyebrow="Risk Heatmap"
            title="Severity × Date"
            right={
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
                <span className="w-2 h-2 rounded-sm bg-emerald-500/60" /><span>low</span>
                <span className="w-2 h-2 rounded-sm bg-amber-500/70" /><span>med</span>
                <span className="w-2 h-2 rounded-sm bg-red-500/80" /><span>high</span>
              </div>
            }
          />
          {heat.columns.length === 0 ? (
            <div className="mt-8 mb-6 text-center text-[12.5px]" style={{ color: "var(--muted-2)" }}>
              No dated transfers in this trace to plot.
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-[3px]">
                {heat.rows.map((r) => (
                  <div key={r.key} className="grid gap-[3px] items-center" style={{ gridTemplateColumns: `18px repeat(${heat.columns.length}, minmax(0,1fr))` }}>
                    <div className="text-[9px] font-mono" style={{ color: r.color }}>{r.short}</div>
                    {heat.columns.map((c, i) => {
                      const count = c[r.key];
                      const intensity = count / r.max;
                      return (
                        <div
                          key={i}
                          title={`${c.label} · ${r.label}: ${count} txn${count !== 1 ? "s" : ""}`}
                          className="h-4 rounded-[3px]"
                          style={{ background: r.color, opacity: count === 0 ? 0.06 : 0.2 + intensity * 0.8 }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="mt-2 ml-[21px] flex justify-between text-[9px] font-mono" style={{ color: "var(--muted)" }}>
                <span>{heat.columns[0].label}</span>
                {heat.columns.length > 2 && <span>{heat.columns[Math.floor(heat.columns.length / 2)].label}</span>}
                <span>{heat.columns[heat.columns.length - 1].label}</span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl p-4 border" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <PanelHeader
            eyebrow="Multi-Agent Fleet"
            title="4 agents · online"
            right={
              <span className="text-[11px] rounded px-1.5 py-0.5 bg-sky-500/10 text-sky-300 border border-sky-500/25">LLM · v4.2</span>
            }
          />
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {FLEET.map(({ agent, load }) => {
              const meta = AGENT_META[agent];
              return (
                <div key={agent} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${liveFeed ? "animate-blink" : ""}`}
                      style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                    />
                    <div className="text-[12px] truncate" style={{ color: "var(--text)" }}>{agent}</div>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full" style={{ width: `${load}%`, background: `linear-gradient(90deg, ${meta.color}, ${meta.color}55)` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--muted)" }}>
                    <span>load</span><span className="font-mono">{load}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Finding Feed + Typology. Sizing the typology rail in pixels keeps its
          progress bars legible at 1024px and hands every extra pixel to the feed. */}
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 flex flex-col rounded-2xl border overflow-hidden" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="shrink-0 p-4 flex items-start justify-between gap-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Real-Time Finding Feed</div>
              <div className="mt-0.5 text-[15px] font-semibold" style={{ color: "var(--text-strong)" }}>Forensic findings</div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[11px]" style={{ color: "var(--muted)" }}>
              <span className={`w-1.5 h-1.5 rounded-full ${liveFeed ? "bg-emerald-400 animate-blink" : "bg-slate-500"}`} />
              {liveFeed ? "streaming" : "paused"}
              {findings.length > 0 && <span>· {findings.length} finding{findings.length !== 1 ? "s" : ""}</span>}
            </div>
          </div>

          {findings.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-[32px] mb-3 opacity-30">◇</div>
              <div className="text-[14px] font-medium" style={{ color: "var(--text-strong)" }}>No findings fired</div>
              <div className="mt-1 text-[12.5px] mx-auto max-w-sm" style={{ color: "var(--muted-2)" }}>No laundering typology fired on this trail — the transfers look routine.</div>
            </div>
          ) : (
            // Bounded so a long list scrolls inside the card instead of stretching
            // the dashboard to several screens.
            <div className="divide-y max-h-[520px] overflow-y-auto" style={{ borderColor: "var(--border)" }}>
              {feedGroups.map((g) => (
                <div key={g.key}>
                  <div className="sticky top-0 z-10 px-4 py-2 text-[11px] uppercase tracking-widest font-semibold backdrop-blur" style={{ color: "var(--muted)", background: "var(--panel-strong)" }}>
                    {g.label} · {g.rows.length}
                  </div>
                  {g.rows.map(({ f, id }) => (
                    <FindingFeedRow
                      key={id}
                      finding={f}
                      expanded={expandedFinding === id}
                      onToggle={() => setExpandedFinding(expandedFinding === id ? null : id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-2xl p-4 border" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <PanelHeader eyebrow="Typology Distribution" title="Detected patterns" />
          {typology.total === 0 ? (
            <div className="mt-8 mb-6 text-center text-[12.5px]" style={{ color: "var(--muted-2)" }}>
              No suspicious typologies detected yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {typology.rows.map((r) => (
                <div key={r.code}>
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-1.5 h-1.5 shrink-0 rounded-full" style={{ background: r.c }} />
                      <span className="truncate" style={{ color: "var(--text)" }}>{r.name}</span>
                    </div>
                    <span className="shrink-0 font-mono tabular-nums" style={{ color: "var(--muted)" }}>{r.count} · {formatUSD(r.amount)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full" style={{ width: `${r.pct}%`, background: `linear-gradient(90deg, ${r.c}, ${r.c}44)` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Sits on the floor of the card so the rail lines up with the bottom
              of the feed beside it rather than trailing off mid-panel. */}
          <div className="mt-auto pt-4">
            <div className="h-px mb-4" style={{ background: "var(--border)" }} />
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.05] p-3">
              <div className="text-[11px] uppercase tracking-widest text-sky-300">Case Summary</div>
              <div className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--text)" }}>
                {openFindings > 0 ? `${openFindings} finding${openFindings !== 1 ? "s" : ""} require review.` : "No pending findings. All systems operating normally."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incoming Citizen Complaints Queue (Always visible for quick officer triage) */}
      <div
        className="mt-6 rounded-2xl border p-5 shadow-md"
        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between gap-3 border-b pb-4 mb-4" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-emerald-400 font-semibold">Incoming Citizen Complaints</div>
            <h2 className="text-base font-bold text-white mt-0.5">NCRP 1930 Helpline Fraud Reports</h2>
            <p className="text-xs text-muted mt-0.5">
              Select any victim-reported suspect wallet below to execute automated multi-hop blockchain tracing.
            </p>
          </div>
          {onGoToCases && (
            <button
              onClick={onGoToCases}
              className="text-xs text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-xl transition"
            >
              View Full Inbox ({cases.length}) &rarr;
            </button>
          )}
        </div>

        <div className="space-y-3">
          {cases.slice(0, 5).map((c) => {
            const chain = detectChain(c.suspect_wallet_address);
            const isTracing = tracingCase === c.case_number;

            return (
              <div
                key={c.case_number}
                className="rounded-xl border p-4 transition hover:border-emerald-500/40 bg-white/[0.01] flex flex-wrap items-center justify-between gap-4"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <span className="font-mono font-bold text-xs text-white">{c.case_number}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {c.jurisdiction_code}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        c.status === "PENDING_TRACING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : c.status === "TRACED"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {c.status}
                    </span>
                    {c.target_vasp && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        VASP: {c.target_vasp}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted flex items-center gap-3 flex-wrap">
                    <span>
                      Complainant: <strong className="text-white">{c.victim_name || "Rajesh Verma"}</strong>
                    </span>
                    <span>·</span>
                    <span className="text-slate-300 font-medium">{c.crime_type}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted">Suspect:</span>
                    <code className="text-xs font-mono text-cyan-300 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                      {c.suspect_wallet_address}
                    </code>
                    {chain && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono"
                        style={{
                          background: `${chainColor(chain)}22`,
                          color: chainColor(chain),
                        }}
                      >
                        {CHAINS[chain].short}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-bold text-rose-400 font-mono">
                    {formatINR(Number(c.loss_amount_inr))}
                  </div>
                  <div className="text-[10px] text-muted mb-2">
                    ~{Math.round(Number(c.loss_amount_inr) / 85).toLocaleString()} {c.token_symbol || "USDT"}
                  </div>

                  <button
                    onClick={() => handleTraceFromDashboard(c)}
                    disabled={isTracing}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                  >
                    <span>⚡</span>
                    <span>{isTracing ? "Tracing..." : "Trace Suspect Wallet"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Page>
  );
}

// ── Dual-track banner — reproduced from InvestigationView ─────────────────────
function TrackBanner({ track }: { track: TrackDecision }) {
  const accent =
    track.overall === "A" ? "#22c55e" : track.overall === "DUAL" ? "#f59e0b" : "#ef4444";
  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: `${accent}0f`, border: `1px solid ${accent}44` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid place-items-center w-9 h-9 rounded-xl shrink-0 font-bold"
          style={{ background: `${accent}22`, color: accent }}
        >
          {track.overall === "DUAL" ? "⚖" : track.overall}
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold" style={{ color: "var(--text-strong)" }}>
            {track.headline}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
            {track.summary}
          </p>
          {track.assessments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {track.assessments.map((a) => {
                const c = a.track === "A" ? "#22c55e" : "#f59e0b";
                return (
                  <span
                    key={a.target.vasp_name}
                    className="text-[11px] px-2.5 py-1 rounded-full border"
                    style={{ borderColor: `${c}55`, background: `${c}14`, color: c }}
                  >
                    {a.target.vasp_name} · Track {a.track} · {a.confidence}%
                    {a.autoFreeze ? " · auto-freeze" : " · review"}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── One expandable finding row in the feed ────────────────────────────────────
function FindingFeedRow({
  finding,
  expanded,
  onToggle,
}: {
  finding: CryptoFinding;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sev: Severity = finding.severity === "info" ? "safe" : finding.severity;
  const dot =
    finding.severity === "high" ? "bg-red-500" : finding.severity === "medium" ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div>
      <div
        className="p-4 flex items-start gap-3 hover:bg-[var(--hover)] transition cursor-pointer group"
        onClick={onToggle}
      >
        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[14px] font-medium" style={{ color: "var(--text-strong)" }}>{finding.title}</div>
            <SeverityBadge severity={sev} />
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--panel-2)", color: "var(--muted)" }}>
              {finding.code}
            </span>
          </div>
          <div className="mt-1 text-[12.5px]" style={{ color: "var(--muted-2)" }}>{finding.short || finding.plain}</div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {finding.amountUsd > 0 && (
              <span className="text-[11px] font-mono" style={{ color: "var(--muted)" }}>{formatUSD(finding.amountUsd)}</span>
            )}
            {finding.wallets.slice(0, 4).map((w, i) => (
              <span key={`${w}-${i}`} className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--panel-2)", color: "var(--muted)" }}>
                {shortWallet(w)}
              </span>
            ))}
            {finding.wallets.length > 4 && (
              <span className="text-[10px]" style={{ color: "var(--muted)" }}>+{finding.wallets.length - 4} more</span>
            )}
          </div>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition text-[11px] rounded-md border px-2 py-1 hover:bg-[var(--hover)] flex-shrink-0"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          Investigate →
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 ml-9">
          <div className="rounded-xl border p-4 space-y-3" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <div className="text-[11px] uppercase tracking-widest text-sky-300">Finding Details</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Finding</div>
                <div className="mt-0.5 text-[13px]" style={{ color: "var(--text)" }}>{finding.title}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Amount</div>
                <div className="mt-0.5 text-[13px] font-mono" style={{ color: "var(--text)" }}>{finding.amountUsd > 0 ? formatUSD(finding.amountUsd) : "—"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Severity</div>
                <div className="mt-1"><SeverityBadge severity={sev} /></div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Code</div>
                <div className="mt-0.5 text-[13px] font-mono" style={{ color: "var(--text)" }}>{finding.code}</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Explanation</div>
              <div className="mt-0.5 text-[13px] leading-relaxed" style={{ color: "var(--text)" }}>{finding.plain}</div>
            </div>
            {finding.wallets.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Wallets</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {finding.wallets.slice(0, 8).map((w, i) => (
                    <span key={`${w}-${i}`} className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--panel)", color: "var(--muted)" }}>
                      {shortWallet(w)}
                    </span>
                  ))}
                  {finding.wallets.length > 8 && (
                    <span className="text-[10px]" style={{ color: "var(--muted)" }}>+{finding.wallets.length - 8} more</span>
                  )}
                </div>
              </div>
            )}
            <div className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Risk Assessment</div>
            <div className="grid grid-cols-3 gap-2">
              <SignalMini label="Severity score" value={finding.severity === "high" ? 92 : finding.severity === "medium" ? 58 : 15} color={severityColor(sev)} />
              <SignalMini label="Confidence" value={finding.severity === "high" ? 87 : 65} color="#38bdf8" />
              <SignalMini label="Priority" value={finding.severity === "high" ? 95 : finding.severity === "medium" ? 60 : 20} color="#a78bfa" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SignalMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
      <div className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="mt-1 text-[16px] font-bold" style={{ color }}>{value}%</div>
      <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full" style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${color}55)` }} />
      </div>
    </div>
  );
}

// ── Risk Heatmap — Severity × Date, built from the traced transfers ───────────
type SevKey = "high" | "medium" | "safe";
type HeatCol = { label: string; high: number; medium: number; safe: number };
type HeatRow = { key: SevKey; label: string; short: string; color: string; max: number };

function dayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDay(d: string) {
  const parts = d.split("-");
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : d;
}

function buildHeatmap(
  transfers: WalletTransfer[],
  sevByAddr: Map<string, Severity>
): { columns: HeatCol[]; rows: HeatRow[] } {
  if (!transfers.length) return { columns: [], rows: [] };

  const byDate = new Map<string, { high: number; medium: number; safe: number }>();
  for (const t of transfers) {
    const sev: Severity = sevByAddr.get(t.to_address) ?? sevByAddr.get(t.from_address) ?? "safe";
    const key = t.timestamp ? dayKey(t.timestamp) : "—";
    const cur = byDate.get(key) ?? { high: 0, medium: 0, safe: 0 };
    cur[sev] += 1;
    byDate.set(key, cur);
  }

  const dates = Array.from(byDate.keys()).sort();
  const MAX = 28;
  let columns: HeatCol[];
  if (dates.length <= MAX) {
    columns = dates.map((d) => ({ label: fmtDay(d), ...byDate.get(d)! }));
  } else {
    columns = [];
    const size = Math.ceil(dates.length / MAX);
    for (let i = 0; i < dates.length; i += size) {
      const slice = dates.slice(i, i + size);
      const agg = { high: 0, medium: 0, safe: 0 };
      slice.forEach((d) => {
        const c = byDate.get(d)!;
        agg.high += c.high;
        agg.medium += c.medium;
        agg.safe += c.safe;
      });
      columns.push({ label: fmtDay(slice[0]), ...agg });
    }
  }

  const rows: HeatRow[] = [
    { key: "high", label: "High", short: "H", color: severityColor("high"), max: Math.max(1, ...columns.map((c) => c.high)) },
    { key: "medium", label: "Medium", short: "M", color: severityColor("medium"), max: Math.max(1, ...columns.map((c) => c.medium)) },
    { key: "safe", label: "Low", short: "L", color: severityColor("safe"), max: Math.max(1, ...columns.map((c) => c.safe)) },
  ];
  return { columns, rows };
}
