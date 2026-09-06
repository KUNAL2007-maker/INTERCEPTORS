"use client";

import { useEffect, useMemo, useState } from "react";
import { Page, Card } from "../ui/Page";
import { useAuth } from "../AuthProvider";
import { useTraceStore } from "@/lib/store";
import type { StoredCase } from "@/lib/db";
import {
  detectChain,
  CHAINS,
  chainColor,
  shortWallet,
  formatINR,
} from "@/lib/domain";
import { normalizeRole } from "@/lib/rbac-abac";

type FilterStatus = "ALL" | "PENDING_TRACING" | "TRACED" | "NOTICE_SERVED" | "FROZEN";

export function CasesView({
  onGoToTrace,
  onGoToGraph,
  onGoToNotices,
}: {
  onGoToTrace: (address?: string) => void;
  onGoToGraph: () => void;
  onGoToNotices: () => void;
}) {
  const { user } = useAuth();
  const { cases, loadCases, runTrace, setActiveCase, ingestNcrpComplaint } = useTraceStore();

  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [search, setSearch] = useState("");
  const [tracingCaseId, setTracingCaseId] = useState<string | null>(null);
  const [forwardedCases, setForwardedCases] = useState<Record<string, boolean>>({});
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [newWallet, setNewWallet] = useState("");
  const [newAmount, setNewAmount] = useState("500000");
  const [newCrime, setNewCrime] = useState("Task-based Fake Part-Time Job Scam");
  const [newNetwork, setNewNetwork] = useState("Ethereum");
  const [newVictim, setNewVictim] = useState("Rajesh Verma");
  const [ingesting, setIngesting] = useState(false);

  const normRole = user ? normalizeRole(user.role) : null;
  const isSupervisor = normRole === "CYBERCRIME_SUPERVISOR" || user?.role === "WORKSPACE_ADMIN";
  const isCourtReviewer = normRole === "COURT_REVIEWER" || user?.role === "AUDITOR";
  const isInvestigatingOfficer = normRole === "INVESTIGATING_OFFICER" || user?.role === "NORMAL_INVESTIGATOR";

  // Authority check: All investigating officers, gazetted officers, and administrators can initiate traces
  const canExecuteTrace =
    normRole === "INVESTIGATING_OFFICER" ||
    normRole === "CYBERCRIME_SUPERVISOR" ||
    normRole === "SENIOR_INVESTIGATOR" ||
    normRole === "NATIONAL_COORDINATION_ANALYST" ||
    user?.role === "NORMAL_INVESTIGATOR" ||
    user?.role === "SENIOR_INVESTIGATOR" ||
    user?.role === "SUPER_ADMIN" ||
    user?.role === "WORKSPACE_ADMIN" ||
    Boolean(user?.is_gazetted);

  const handleAssignIO = async (caseNumber: string, ioId: number, ioName: string) => {
    try {
      const res = await fetch('/api/cases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_number: caseNumber, assigned_investigator_id: ioId, assigned_investigator_name: ioName })
      });
      if (res.ok) {
        await loadCases();
      }
    } catch {}
  };

  const handleChangePriority = async (caseNumber: string, priority: string) => {
    try {
      const res = await fetch('/api/cases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_number: caseNumber, priority })
      });
      if (res.ok) {
        await loadCases();
      }
    } catch {}
  };

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (filter !== "ALL" && c.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNumber = c.case_number.toLowerCase().includes(q);
        const matchWallet = c.suspect_wallet_address.toLowerCase().includes(q);
        const matchVictim = (c.victim_name || "").toLowerCase().includes(q);
        const matchCrime = (c.crime_type || "").toLowerCase().includes(q);
        if (!matchNumber && !matchWallet && !matchVictim && !matchCrime) return false;
      }
      return true;
    });
  }, [cases, filter, search]);

  const counts = useMemo(() => {
    return {
      total: cases.length,
      pending: cases.filter((c) => c.status === "PENDING_TRACING").length,
      traced: cases.filter((c) => c.status === "TRACED").length,
      noticeServed: cases.filter((c) => c.status === "NOTICE_SERVED").length,
      frozen: cases.filter((c) => c.status === "FROZEN").length,
    };
  }, [cases]);

  const handleTraceClick = async (c: StoredCase) => {
    if (!canExecuteTrace) {
      // Non-gazetted officer (e.g., Sub-Inspector Patil): Forward to ACP Sharma
      setForwardedCases((prev) => ({ ...prev, [c.case_number]: true }));
      return;
    }

    setTracingCaseId(c.case_number);
    try {
      setActiveCase(c);
      await runTrace(c.suspect_wallet_address, c);
      onGoToTrace(c.suspect_wallet_address);
    } catch {
      // Fallback
    } finally {
      setTracingCaseId(null);
    }
  };

  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWallet.trim()) return;
    setIngesting(true);
    try {
      const ackNo = `NCRP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      await ingestNcrpComplaint({
        complaint_id: ackNo,
        portal: "NCRP_1930_HELPLINE",
        victim_name: newVictim,
        victim_phone: "+91-98765-43210",
        suspect_wallet: newWallet.trim(),
        crime_category: newCrime,
        loss_amount_inr: Number(newAmount),
        blockchain_network: newNetwork,
      });
      setShowIngestModal(false);
      setNewWallet("");
    } catch {
      // Ignore
    } finally {
      setIngesting(false);
    }
  };

  return (
    <Page width="wide">
      {/* Header Banner */}
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
              📑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  NCRP Cyber Crime Complaints & Case Management
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                  {user?.role === "SUPER_ADMIN" ? "PAN-INDIA CENTRAL GATEWAY" : user?.jurisdiction_code || "MH-CYBER-01"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Logged in as <strong className="text-white">{user?.name}</strong> ({user?.role}) &bull;{" "}
                {user?.is_gazetted
                  ? "Gazetted Officer (Sec 94 BNSS Statutory Trace & Freeze Authority)"
                  : "Field Investigator (Assigned Cases)"}
              </p>
            </div>
          </div>

          {!isCourtReviewer ? (
            <button
              onClick={() => setShowIngestModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              + Ingest 1930 Phone Complaint
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs font-bold flex items-center gap-2 shadow-sm">
              <span className="text-amber-400 font-mono text-sm">⚖️</span>
              <span>READ ONLY EVIDENCE REVIEW MODE</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Total Case Files</div>
          <div className="text-2xl font-bold text-white">{counts.total}</div>
          <div className="text-[11px] text-muted mt-1">In assigned jurisdiction scope</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Pending Forensic Trace</div>
          <div className="text-2xl font-bold text-amber-400">{counts.pending}</div>
          <div className="text-[11px] text-amber-400 mt-1">Awaiting multi-hop BFS trace</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Money Flow Traced</div>
          <div className="text-2xl font-bold text-cyan-400">{counts.traced}</div>
          <div className="text-[11px] text-cyan-400 mt-1">Ready for Sec 94 BNSS notice</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Exchange Freezes Active</div>
          <div className="text-2xl font-bold text-emerald-400">{counts.frozen + counts.noticeServed}</div>
          <div className="text-[11px] text-emerald-400 mt-1">{counts.frozen} locked in escrow</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="rounded-2xl border p-4 mb-6 flex flex-wrap items-center justify-between gap-4"
        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(
            [
              ["ALL", `All Cases (${counts.total})`],
              ["PENDING_TRACING", `Pending Trace (${counts.pending})`],
              ["TRACED", `Traced (${counts.traced})`],
              ["NOTICE_SERVED", `Notice Served (${counts.noticeServed})`],
              ["FROZEN", `Frozen (${counts.frozen})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                filter === key
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                  : "text-muted hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ack no, wallet 0x..., victim..."
            className="w-full px-3.5 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            style={{
              background: "var(--surface-sunken)",
              borderColor: "var(--border)",
              color: "var(--text-strong)",
            }}
          />
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.map((c) => {
          const chain = detectChain(c.suspect_wallet_address);
          const isTracingThis = tracingCaseId === c.case_number;
          const isForwarded = forwardedCases[c.case_number];

          return (
            <div
              key={c.id || c.case_number}
              className="rounded-2xl border p-5 transition hover:border-emerald-500/40"
              style={{ background: "var(--panel)", borderColor: "var(--border)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-3 mb-3" style={{ borderColor: "var(--border)" }}>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm text-white">{c.case_number}</span>
                    <StatusBadge status={c.status} />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {c.jurisdiction_code}
                    </span>
                    {c.target_vasp && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        VASP: {c.target_vasp}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Complainant: <strong className="text-white">{c.victim_name || "Rajesh Verma"}</strong>
                    {c.victim_email ? ` (${c.victim_email})` : ""} &bull; Reported:{" "}
                    <span className="text-slate-300 font-mono">{c.incident_date || c.created_at?.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wider">Claimed Loss</div>
                  <div className="text-lg font-bold text-rose-400 font-mono">
                    {formatINR(c.loss_amount_inr ?? 0)}
                  </div>
                  <div className="text-[10px] text-muted">
                    ~{Math.round((Number(c.loss_amount_inr) || 0) / 85).toLocaleString("en-US")} {c.token_symbol || "USDT"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
                <div className="md:col-span-2">
                  <span className="text-muted block text-[10px] uppercase font-semibold mb-1">
                    Suspect Cryptocurrency Wallet Address
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-cyan-300 font-mono break-all text-xs bg-black/40 px-2 py-1 rounded border border-white/5 flex-1">
                      {c.suspect_wallet_address}
                    </code>
                    {chain && (
                      <span
                        className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{
                          background: `${chainColor(chain)}22`,
                          color: chainColor(chain),
                          border: `1px solid ${chainColor(chain)}44`,
                        }}
                      >
                        {CHAINS[chain].name}
                      </span>
                    )}
                  </div>
                  {c.notes && <p className="text-[11.5px] text-muted mt-2 italic">&ldquo;{c.notes}&rdquo;</p>}
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold mb-1">Crime Typology</span>
                  <div className="text-white font-medium">{c.crime_type}</div>
                  {c.tx_hashes && c.tx_hashes.length > 0 && (
                    <div className="mt-2 text-[10.5px] text-muted">
                      <span>Tx: </span>
                      <code className="text-slate-400 font-mono">{shortWallet(c.tx_hashes[0])}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="text-[11px] text-muted flex flex-wrap items-center gap-2">
                  <span>IO:</span>
                  {isSupervisor ? (
                    <select
                      value={c.assigned_investigator_id || 3}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handleAssignIO(c.case_number, val, val === 3 ? "SI Patil" : val === 12 ? "Inspector Mehra" : "SI Kulkarni");
                      }}
                      className="rounded border px-2 py-0.5 text-xs bg-[var(--chip)] text-white focus:outline-none"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <option value={3}>SI Patil (id: 3)</option>
                      <option value={12}>Inspector Mehra (id: 12)</option>
                      <option value={14}>SI Kulkarni (id: 14)</option>
                    </select>
                  ) : (
                    <strong className="text-white">{c.assigned_investigator_name || user?.name || "SI Patil"}</strong>
                  )}
                  {isSupervisor && (
                    <select
                      value={c.priority || "HIGH"}
                      onChange={(e) => handleChangePriority(c.case_number, e.target.value)}
                      className="rounded border px-1.5 py-0.5 text-[10px] font-bold bg-[var(--chip)] text-amber-400 focus:outline-none"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {c.status === "PENDING_TRACING" && (
                    canExecuteTrace ? (
                      <button
                        onClick={() => handleTraceClick(c)}
                        disabled={isTracingThis}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow disabled:opacity-50 flex items-center gap-1.5"
                        style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                      >
                        <span>⚡</span>
                        <span>{isTracingThis ? "Tracing Suspect Wallet..." : "Initiate Trace on Suspect Wallet"}</span>
                      </button>
                    ) : (
                      !isForwarded ? (
                        <button
                          onClick={() => handleTraceClick(c)}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition flex items-center gap-1.5"
                        >
                          <span>🔒</span>
                          <span>Forward to ACP Sharma for BFS Trace</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1.5 font-semibold">
                          <span>✓</span>
                          <span>Queued for ACP Sharma Trace Approval</span>
                        </span>
                      )
                    )
                  )}

                  {c.status === "TRACED" && (
                    <>
                      <button
                        onClick={() => {
                          setActiveCase(c);
                          void runTrace(c.suspect_wallet_address, c);
                          onGoToGraph();
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25 transition flex items-center gap-1.5"
                      >
                        <span>📊</span>
                        <span>View Money Flow Graph</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveCase(c);
                          onGoToNotices();
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition flex items-center gap-1.5"
                      >
                        <span>⚖️</span>
                        <span>Issue Sec 94 BNSS Notice</span>
                      </button>
                    </>
                  )}

                  {(c.status === "NOTICE_SERVED" || c.status === "FROZEN") && (
                    <button
                      onClick={() => {
                        setActiveCase(c);
                        onGoToNotices();
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 transition flex items-center gap-1.5"
                    >
                      <span>🔒</span>
                      <span>{c.status === "FROZEN" ? "View Seizure & Escrow Details" : "Track Served Freeze Requisition"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="rounded-2xl border p-12 text-center" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
            <div className="text-3xl mb-2">📁</div>
            <div className="text-sm font-bold text-white">No complaint records found</div>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              No cases matching your current filter criteria. Use "+ Ingest 1930 Phone Complaint" to register a newly reported victim incident.
            </p>
          </div>
        )}
      </div>

      {/* Manual Complaint Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative"
            style={{
              background: "#0d1117",
              borderColor: "var(--border)",
              color: "var(--text-strong)",
            }}
          >
            <button
              onClick={() => setShowIngestModal(false)}
              className="absolute right-4 top-4 text-muted hover:text-white text-lg"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-white mb-1">Ingest Citizen Complaint (NCRP 1930)</h2>
            <p className="text-xs text-muted mb-4">
              Registers fraud allegation directly into Maharashtra Cyber attribution queue.
            </p>

            <form onSubmit={handleManualIngest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">Complainant Full Name</label>
                <input
                  type="text"
                  value={newVictim}
                  onChange={(e) => setNewVictim(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    background: "var(--surface-sunken)",
                    borderColor: "var(--border)",
                    color: "var(--text-strong)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">Suspect Wallet Address</label>
                <input
                  type="text"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  placeholder="0x... or T..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none font-mono"
                  style={{
                    background: "var(--surface-sunken)",
                    borderColor: "var(--border)",
                    color: "var(--text-strong)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted">Blockchain Network</label>
                  <select
                    value={newNetwork}
                    onChange={(e) => setNewNetwork(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                    style={{
                      background: "var(--surface-sunken)",
                      borderColor: "var(--border)",
                      color: "var(--text-strong)",
                    }}
                  >
                    <option value="Ethereum">Ethereum (ERC-20)</option>
                    <option value="Polygon">Polygon (MATIC)</option>
                    <option value="TRON">TRON (TRC-20)</option>
                    <option value="Bitcoin">Bitcoin (BTC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted">Loss Amount (INR)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                    style={{
                      background: "var(--surface-sunken)",
                      borderColor: "var(--border)",
                      color: "var(--text-strong)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">Crime Category</label>
                <input
                  type="text"
                  value={newCrime}
                  onChange={(e) => setNewCrime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    background: "var(--surface-sunken)",
                    borderColor: "var(--border)",
                    color: "var(--text-strong)",
                  }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={ingesting}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-black transition disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  {ingesting ? "Ingesting..." : "Ingest Case & Alert Attribution Engine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING_TRACING":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold animate-pulse">
          ● PENDING TRACE
        </span>
      );
    case "TRACED":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
          ✓ TRACED
        </span>
      );
    case "NOTICE_SERVED":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold">
          ⚖️ NOTICE SERVED
        </span>
      );
    case "FROZEN":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
          🔒 ASSETS FROZEN
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {status}
        </span>
      );
  }
}
