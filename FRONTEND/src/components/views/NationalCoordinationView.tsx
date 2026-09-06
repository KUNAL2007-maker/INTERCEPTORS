"use client";

import { useState, useMemo } from "react";
import { useAuth } from "../AuthProvider";
import { Page } from "../ui/Page";

type MultiStateLink = {
  id: string;
  clusterAddress: string;
  clusterLabel: string;
  cases: {
    state: string;
    caseNumber: string;
    unit: string;
    lossInr: number;
    targetVasp: string;
    status: string;
  }[];
  commonEndpoints: string[];
  totalExposureInr: number;
  patternType: string;
  alertIssued: boolean;
};

const INITIAL_CROSS_STATE_LINKS: MultiStateLink[] = [
  {
    id: "LINK-2026-CLUSTER-ALPHA",
    clusterAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    clusterLabel: "Wallet Cluster Alpha (Multi-Hop Intermediary)",
    cases: [
      {
        state: "Maharashtra",
        caseNumber: "MH-CYBER-2026-0842",
        unit: "Maharashtra Cyber Unit",
        lossInr: 450000,
        targetVasp: "Binance International",
        status: "TRACED"
      },
      {
        state: "Karnataka",
        caseNumber: "KA-CYBER-2026-1104",
        unit: "Karnataka Cyber Crime Cell",
        lossInr: 1800000,
        targetVasp: "Binance International",
        status: "TRACED"
      },
      {
        state: "Delhi",
        caseNumber: "DL-CYBER-2026-0319",
        unit: "Delhi Police Cyber Hub",
        lossInr: 8500000,
        targetVasp: "WazirX India",
        status: "PENDING_TRACING"
      }
    ],
    commonEndpoints: ["Binance International (Deposit)", "WazirX India (Off-ramp)"],
    totalExposureInr: 10750000,
    patternType: "Peeling Chain -> Rapid Dual-Exchange Deposit",
    alertIssued: false
  },
  {
    id: "LINK-2026-CLUSTER-BETA",
    clusterAddress: "0x55aa33bb110022cc44dd99ee88ff77aa66bb55cc",
    clusterLabel: "Cross-Chain Bridge Cluster (Tron-Ethereum)",
    cases: [
      {
        state: "National (I4C)",
        caseNumber: "IN-I4C-2026-9901",
        unit: "Central Cyber Crime Coordination",
        lossInr: 125000000,
        targetVasp: "Binance International",
        status: "NOTICE_SERVED"
      },
      {
        state: "Maharashtra",
        caseNumber: "CRIME-165445",
        unit: "Maharashtra Cyber Unit",
        lossInr: 750000,
        targetVasp: "Binance International",
        status: "TRACED"
      }
    ],
    commonEndpoints: ["Binance International", "TronGrid Bridge"],
    totalExposureInr: 125750000,
    patternType: "Cross-Border Liquidity Pool Mixing",
    alertIssued: true
  }
];

export function NationalCoordinationView() {
  const { user } = useAuth();
  const [links, setLinks] = useState<MultiStateLink[]>(INITIAL_CROSS_STATE_LINKS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(links[0].id);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const filteredLinks = useMemo(() => {
    if (!searchTerm.trim()) return links;
    const q = searchTerm.toLowerCase();
    return links.filter(
      (l) =>
        l.clusterAddress.toLowerCase().includes(q) ||
        l.clusterLabel.toLowerCase().includes(q) ||
        l.cases.some((c) => c.caseNumber.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
    );
  }, [links, searchTerm]);

  const activeCluster = useMemo(
    () => links.find((l) => l.id === selectedCluster) || links[0],
    [links, selectedCluster]
  );

  const handleGenerateAlert = (clusterId: string) => {
    setLinks((prev) =>
      prev.map((item) => (item.id === clusterId ? { ...item, alertIssued: true } : item))
    );
    setAlertMessage(`National Intelligence Alert dispatched to affected State Cyber Units for cluster ${clusterId}.`);
    setTimeout(() => setAlertMessage(null), 5000);
  };

  return (
    <Page width="wide">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-sky-400">
            I4C NATIONAL OVERSIGHT
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          National Coordination Intelligence Hub
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Simulated cross-jurisdictional intelligence · Multi-state correlation & aggregated wallet clusters
        </p>
      </div>

      {/* Compliance / Boundary Notice */}
      <div
        className="rounded-xl border p-3.5 mb-6 text-xs flex items-start gap-3"
        style={{
          background: "rgba(56, 189, 248, 0.08)",
          borderColor: "rgba(56, 189, 248, 0.25)",
          color: "var(--text)"
        }}
      >
        <span className="text-sky-400 text-base mt-0.5">ℹ️</span>
        <div>
          <span className="font-bold text-sky-400">Cross-Jurisdictional Intelligence Protocol:</span>{" "}
          Correlations between state investigation dockets are flagged algorithmically as{" "}
          <span className="font-semibold text-amber-400">"POTENTIAL CROSS-JURISDICTIONAL LINK"</span>. By statutory rule,
          national analysts must not preemptively label correlations as confirmed criminal syndicates without verified judicial
          warrants.
        </div>
      </div>

      {alertMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-4 text-xs text-emerald-400 flex items-center justify-between animate-fade-in">
          <span>{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="text-emerald-300 font-bold ml-2">×</button>
        </div>
      )}

      {/* National Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-[11px] text-muted uppercase font-semibold">Active State Links</div>
          <div className="text-2xl font-bold mt-1 text-sky-400">{links.length} Identified</div>
          <div className="text-[10px] text-muted mt-1">Spanning MH, KA, DL & Central</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-[11px] text-muted uppercase font-semibold">Correlated Dockets</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "var(--text-strong)" }}>5 Cyber Dockets</div>
          <div className="text-[10px] text-muted mt-1">Linked via shared on-chain hops</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-[11px] text-muted uppercase font-semibold">Aggregated Money Trail</div>
          <div className="text-2xl font-bold mt-1 text-amber-400">₹13.65 Crore</div>
          <div className="text-[10px] text-muted mt-1">Total multi-state volume</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-[11px] text-muted uppercase font-semibold">Common VASP Endpoints</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">2 Exchanges</div>
          <div className="text-[10px] text-muted mt-1">Binance Int., WazirX India</div>
        </div>
      </div>

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
            placeholder="Search wallet, state, or case number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
            style={{ background: "var(--chip)", borderColor: "var(--border)", color: "var(--text)" }}
          />

          <div className="space-y-3">
            {filteredLinks.map((link) => {
              const isSelected = selectedCluster === link.id;
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      POTENTIAL CROSS-JURISDICTIONAL LINK
                    </span>
                    {link.alertIssued && (
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        ALERT ISSUED
                      </span>
                    )}
                  </div>

                  <div className="font-semibold text-xs mb-1" style={{ color: "var(--text-strong)" }}>
                    {link.clusterLabel}
                  </div>

                  <div className="font-mono text-[11px] text-muted truncate mb-2">
                    {link.clusterAddress}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <span>{link.cases.length} States / Units</span>
                    <span className="font-bold text-amber-400">₹{(link.totalExposureInr / 100000).toFixed(1)}L Traced</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Multi-State Flow & Intelligence Details */}
        <div className="lg:col-span-7 space-y-6">
          {activeCluster ? (
            <div className="rounded-xl border p-5 space-y-6" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div>
                  <div className="inline-flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-sky-400">{activeCluster.id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      POTENTIAL CROSS-JURISDICTIONAL LINK
                    </span>
                  </div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text-strong)" }}>
                    {activeCluster.clusterLabel}
                  </h2>
                  <div className="font-mono text-xs text-muted mt-1 select-all">
                    {activeCluster.clusterAddress}
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateAlert(activeCluster.id)}
                  disabled={activeCluster.alertIssued}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow ${
                    activeCluster.alertIssued
                      ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                      : "bg-sky-600 hover:bg-sky-500 text-white"
                  }`}
                >
                  {activeCluster.alertIssued ? "✓ Intelligence Alert Sent" : "⚡ Generate Cross-State Alert"}
                </button>
              </div>

              {/* Multi-Hop Flow Visualization Chain */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                  Multi-State Fund Flow Topology
                </h4>
                <div className="p-4 rounded-xl border space-y-3" style={{ background: "var(--chip)", borderColor: "var(--border)" }}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                    {activeCluster.cases.map((c, idx) => (
                      <div key={c.caseNumber} className="flex-1 flex flex-col items-center sm:items-start p-2.5 rounded-lg border w-full" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
                        <span className="text-[10px] font-bold uppercase text-sky-400">{c.state}</span>
                        <span className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-strong)" }}>{c.caseNumber}</span>
                        <span className="text-[10px] text-muted">{c.unit}</span>
                        <span className="text-[11px] font-mono font-bold text-amber-400 mt-1">₹{(c.lossInr / 100000).toFixed(2)}L</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-xs font-medium text-amber-400">
                      🔗 Convergence Node: Intermediary Wallet <code>{activeCluster.clusterAddress.slice(0, 10)}...{activeCluster.clusterAddress.slice(-8)}</code>
                    </span>
                  </div>

                  <div className="text-[11px] text-muted flex items-center justify-between px-1">
                    <span>Common VASP Endpoints: <strong>{activeCluster.commonEndpoints.join(", ")}</strong></span>
                    <span>Typology: <strong>{activeCluster.patternType}</strong></span>
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
                    <thead className="border-b text-[10px] uppercase font-semibold text-muted" style={{ background: "var(--chip)", borderColor: "var(--border)" }}>
                      <tr>
                        <th className="p-2.5">State / Jurisdiction</th>
                        <th className="p-2.5">Case Number</th>
                        <th className="p-2.5">Investigating Unit</th>
                        <th className="p-2.5">Target VASP</th>
                        <th className="p-2.5">Loss (INR)</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {activeCluster.cases.map((c) => (
                        <tr key={c.caseNumber} className="hover:bg-[var(--hover)] transition">
                          <td className="p-2.5 font-bold text-sky-400">{c.state}</td>
                          <td className="p-2.5 font-mono">{c.caseNumber}</td>
                          <td className="p-2.5 text-muted">{c.unit}</td>
                          <td className="p-2.5 font-medium">{c.targetVasp}</td>
                          <td className="p-2.5 font-mono text-amber-400">₹{c.lossInr.toLocaleString('en-IN')}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
            <div className="rounded-xl border p-8 text-center text-muted" style={{ borderColor: "var(--border)" }}>
              Select a wallet cluster to inspect cross-state intelligence links.
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
