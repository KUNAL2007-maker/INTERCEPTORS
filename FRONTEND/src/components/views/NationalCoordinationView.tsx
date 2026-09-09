"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Page } from "../ui/Page";
import { formatINR } from "@/lib/domain";

/** One case within a shared-wallet cluster (shape mirrors /api/national). */
type ClusterCase = {
  state: string;
  jurisdiction: string;
  caseNumber: string;
  victimName: string;
  lossInr: number;
  targetVasp: string;
  chain: string;
  status: string;
  crimeType: string;
};

/** A set of dockets that all name the same suspect wallet. */
type Cluster = {
  id: string;
  clusterAddress: string;
  sameSyndicate: boolean;
  crossJurisdiction: boolean;
  states: string[];
  jurisdictions: string[];
  chains: string[];
  commonVasps: string[];
  totalExposureInr: number;
  caseCount: number;
  cases: ClusterCase[];
};

type NationalResponse = {
  analyst: { name: string; role: string };
  totals: {
    dockets: number;
    clusters: number;
    flaggedSyndicates: number;
    correlatedDockets: number;
    aggregatedExposureInr: number;
  };
  clusters: Cluster[];
};

const STATUS_TONE: Record<string, string> = {
  FROZEN: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  RECOVERED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  NOTICE_SERVED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  TRACED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  AWAITING_SIGNATURE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PENDING_TRACING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  FREEZE_REFUSED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

function statusTone(status: string): string {
  return STATUS_TONE[status] || "bg-white/5 text-muted border-[var(--border)]";
}

export function NationalCoordinationView() {
  const [data, setData] = useState<NationalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alerted, setAlerted] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/national", { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status}).`);
      }
      const json: NationalResponse = await res.json();
      setData(json);
      setSelectedCluster((prev) => prev ?? json.clusters[0]?.id ?? null);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Unable to load national correlation data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clusters = data?.clusters ?? [];

  const filteredLinks = useMemo(() => {
    if (!searchTerm.trim()) return clusters;
    const q = searchTerm.toLowerCase();
    return clusters.filter(
      (l) =>
        l.clusterAddress.toLowerCase().includes(q) ||
        l.commonVasps.some((v) => v.toLowerCase().includes(q)) ||
        l.states.some((s) => s.toLowerCase().includes(q)) ||
        l.cases.some((c) => c.caseNumber.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
    );
  }, [clusters, searchTerm]);

  const activeCluster = useMemo(
    () => clusters.find((l) => l.id === selectedCluster) || clusters[0] || null,
    [clusters, selectedCluster]
  );

  const handleGenerateAlert = (clusterId: string) => {
    setAlerted((prev) => new Set(prev).add(clusterId));
    setAlertMessage(
      `National Intelligence Alert dispatched to affected State Cyber Units for cluster ${clusterId}.`
    );
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const totals = data?.totals;
  const crossBorderStates = useMemo(() => {
    const s = new Set<string>();
    clusters.filter((c) => c.crossJurisdiction).forEach((c) => c.states.forEach((x) => s.add(x)));
    return Array.from(s);
  }, [clusters]);
  const allVasps = useMemo(() => {
    const s = new Set<string>();
    clusters.forEach((c) => c.commonVasps.forEach((v) => s.add(v)));
    return Array.from(s);
  }, [clusters]);

  return (
    <Page width="wide">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-sky-400">
            I4C NATIONAL OVERSIGHT
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-strong)" }}>
          National Coordination Intelligence Hub
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Live cross-jurisdictional correlation · dockets clustered by shared on-chain suspect wallet
          {data?.analyst?.name ? ` · analyst ${data.analyst.name}` : ""}
        </p>
      </div>

      {/* Compliance / Boundary Notice */}
      <div
        className="rounded-xl border p-3.5 mb-6 text-xs flex items-start gap-3"
        style={{
          background: "rgba(56, 189, 248, 0.08)",
          borderColor: "rgba(56, 189, 248, 0.25)",
          color: "var(--text)",
        }}
      >
        <span className="text-sky-400 text-base mt-0.5">ℹ️</span>
        <div>
          <span className="font-bold text-sky-400">Cross-Jurisdictional Intelligence Protocol:</span> Dockets
          that name the <span className="font-semibold">same on-chain suspect wallet</span> across two or more
          states are flagged as a{" "}
          <span className="font-semibold text-rose-400">SAME SCAMMER GROUP</span> correlation. This is an
          investigative lead for the affected State Cyber Units — not a judicial finding. National analysts
          must not label a correlation a confirmed syndicate without a verified warrant.
        </div>
      </div>

      {alertMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-4 text-xs text-emerald-400 flex items-center justify-between animate-fade-in">
          <span>{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="text-emerald-300 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border p-8 text-center text-muted" style={{ borderColor: "var(--border)" }}>
          Correlating national dockets…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* National Overview KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
              <div className="text-[11px] text-muted uppercase font-semibold">Flagged Syndicates</div>
              <div className="text-2xl font-bold mt-1 text-rose-400">{totals?.flaggedSyndicates ?? 0}</div>
              <div className="text-[10px] text-muted mt-1">
                Same wallet across {crossBorderStates.length || 0} states
              </div>
            </div>
            <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
              <div className="text-[11px] text-muted uppercase font-semibold">Correlated Dockets</div>
              <div className="text-2xl font-bold mt-1" style={{ color: "var(--text-strong)" }}>
                {totals?.correlatedDockets ?? 0}
              </div>
              <div className="text-[10px] text-muted mt-1">
                Linked across {totals?.clusters ?? 0} wallet clusters
              </div>
            </div>
            <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
              <div className="text-[11px] text-muted uppercase font-semibold">Aggregated Money Trail</div>
              <div className="text-2xl font-bold mt-1 text-amber-400">
                {formatINR(totals?.aggregatedExposureInr ?? 0)}
              </div>
              <div className="text-[10px] text-muted mt-1">Total correlated exposure</div>
            </div>
            <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
              <div className="text-[11px] text-muted uppercase font-semibold">Common VASP Endpoints</div>
              <div className="text-2xl font-bold mt-1 text-emerald-400">{allVasps.length}</div>
              <div className="text-[10px] text-muted mt-1 truncate">
                {allVasps.length ? allVasps.join(", ") : "None correlated yet"}
              </div>
            </div>
          </div>

          {clusters.length === 0 ? (
            <div
              className="rounded-xl border p-8 text-center text-muted"
              style={{ borderColor: "var(--border)" }}
            >
              No cross-docket wallet correlations found yet. A cluster appears here as soon as two or more
              complaints report the same suspect wallet address.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Clusters List */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                    Correlated Wallet Clusters
                  </h3>
                  <span className="text-xs text-muted font-mono">{filteredLinks.length} clusters</span>
                </div>

                <input
                  type="text"
                  placeholder="Search wallet, state, VASP, or case number…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                  style={{ background: "var(--chip)", borderColor: "var(--border)", color: "var(--text)" }}
                />

                <div className="space-y-3">
                  {filteredLinks.map((link) => {
                    const isSelected = (selectedCluster ?? activeCluster?.id) === link.id;
                    return (
                      <div
                        key={link.id}
                        onClick={() => setSelectedCluster(link.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? "ring-1 ring-sky-400 border-sky-400/50 bg-sky-500/5"
                            : "hover:border-sky-500/30 hover:bg-[var(--hover)]"
                        }`}
                        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center justify-between mb-2 gap-2">
                          {link.sameSyndicate ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              ⚠ SAME SCAMMER GROUP
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              REPEAT WALLET
                            </span>
                          )}
                          {alerted.has(link.id) && (
                            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              ALERT ISSUED
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {link.states.map((s) => (
                            <span
                              key={s}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            >
                              {s}
                            </span>
                          ))}
                        </div>

                        <div className="font-mono text-[11px] text-muted truncate mb-2">
                          {link.clusterAddress}
                        </div>

                        <div
                          className="flex items-center justify-between text-[11px] text-muted pt-2 border-t"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <span>
                            {link.caseCount} dockets · {link.states.length} states
                          </span>
                          <span className="font-bold text-amber-400">{formatINR(link.totalExposureInr)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Multi-State Flow & Intelligence Details */}
              <div className="lg:col-span-7 space-y-6">
                {activeCluster ? (
                  <div
                    className="rounded-xl border p-5 space-y-6"
                    style={{ background: "var(--panel)", borderColor: "var(--border)" }}
                  >
                    {/* Header */}
                    <div
                      className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div>
                        <div className="inline-flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono font-bold text-sky-400">{activeCluster.id}</span>
                          {activeCluster.sameSyndicate ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              ⚠ SAME SCAMMER GROUP — {activeCluster.states.length} STATES
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              REPEAT WALLET
                            </span>
                          )}
                        </div>
                        <h2 className="text-base font-bold" style={{ color: "var(--text-strong)" }}>
                          Convergence wallet reported in {activeCluster.caseCount} dockets
                        </h2>
                        <div className="font-mono text-xs text-muted mt-1 select-all break-all">
                          {activeCluster.clusterAddress}
                        </div>
                      </div>

                      <button
                        onClick={() => handleGenerateAlert(activeCluster.id)}
                        disabled={alerted.has(activeCluster.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow ${
                          alerted.has(activeCluster.id)
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                            : "bg-sky-600 hover:bg-sky-500 text-white"
                        }`}
                      >
                        {alerted.has(activeCluster.id) ? "✓ Intelligence Alert Sent" : "⚡ Generate Cross-State Alert"}
                      </button>
                    </div>

                    {/* Multi-Hop Flow Visualization Chain */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                        Multi-State Fund Flow Topology
                      </h4>
                      <div
                        className="p-4 rounded-xl border space-y-3"
                        style={{ background: "var(--chip)", borderColor: "var(--border)" }}
                      >
                        <div className="flex flex-col sm:flex-row items-stretch justify-between gap-2 text-center sm:text-left">
                          {activeCluster.cases.map((c) => (
                            <div
                              key={c.caseNumber}
                              className="flex-1 flex flex-col items-center sm:items-start p-2.5 rounded-lg border w-full"
                              style={{ background: "var(--panel)", borderColor: "var(--border)" }}
                            >
                              <span className="text-[10px] font-bold uppercase text-sky-400">{c.state}</span>
                              <span
                                className="text-xs font-semibold mt-0.5"
                                style={{ color: "var(--text-strong)" }}
                              >
                                {c.caseNumber}
                              </span>
                              <span className="text-[10px] text-muted">{c.targetVasp}</span>
                              <span className="text-[11px] font-mono font-bold text-amber-400 mt-1">
                                {formatINR(c.lossInr)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                          <span className="text-xs font-medium text-rose-300">
                            🔗 Convergence node — one wallet collects from all{" "}
                            {activeCluster.caseCount} complaints:{" "}
                            <code>
                              {activeCluster.clusterAddress.slice(0, 10)}…{activeCluster.clusterAddress.slice(-8)}
                            </code>
                          </span>
                        </div>

                        <div className="text-[11px] text-muted flex flex-wrap items-center justify-between gap-2 px-1">
                          <span>
                            Common off-ramp VASP:{" "}
                            <strong className="text-emerald-400">
                              {activeCluster.commonVasps.length ? activeCluster.commonVasps.join(", ") : "—"}
                            </strong>
                          </span>
                          <span>
                            Chains:{" "}
                            <strong style={{ color: "var(--text-strong)" }}>
                              {activeCluster.chains.length ? activeCluster.chains.join(", ") : "—"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Correlated Dockets Table */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                        Connected Investigation Dockets
                      </h4>
                      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                        <table className="w-full text-left text-xs">
                          <thead
                            className="border-b text-[10px] uppercase font-semibold text-muted"
                            style={{ background: "var(--chip)", borderColor: "var(--border)" }}
                          >
                            <tr>
                              <th className="p-2.5">State</th>
                              <th className="p-2.5">Case Number</th>
                              <th className="p-2.5">Complainant</th>
                              <th className="p-2.5">Target VASP</th>
                              <th className="p-2.5">Loss</th>
                              <th className="p-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                            {activeCluster.cases.map((c) => (
                              <tr key={c.caseNumber} className="hover:bg-[var(--hover)] transition">
                                <td className="p-2.5 font-bold text-sky-400">{c.state}</td>
                                <td className="p-2.5 font-mono">{c.caseNumber}</td>
                                <td className="p-2.5 text-muted">{c.victimName}</td>
                                <td className="p-2.5 font-medium">{c.targetVasp}</td>
                                <td className="p-2.5 font-mono text-amber-400">{formatINR(c.lossInr)}</td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusTone(
                                      c.status
                                    )}`}
                                  >
                                    {c.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-xl border p-8 text-center text-muted"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Select a wallet cluster to inspect cross-state intelligence links.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Page>
  );
}
