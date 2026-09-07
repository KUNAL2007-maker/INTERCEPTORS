"use client";

import { useMemo, useState } from "react";
import { Page, Card } from "../ui/Page";
import { useAuth } from "../AuthProvider";
import { useTraceStore } from "@/lib/store";
import type { StoredCase } from "@/lib/db";
import {
  formatINR,
  shortWallet,
  detectChain,
  CHAINS,
  chainColor
} from "@/lib/domain";
import { normalizeRole } from "@/lib/rbac-abac";

export function CommandDashboard({
  liveFeed,
  onGoToTrace,
  onGoToCases,
  onGoToGraph,
  onGoToNotices,
  onGoToChat,
}: {
  liveFeed?: boolean;
  onGoToTrace?: () => void;
  onGoToCases?: () => void;
  onGoToGraph?: () => void;
  onGoToNotices?: () => void;
  onGoToChat?: () => void;
}) {
  const { user } = useAuth();
  const { cases, loadCases, runTrace, setActiveCase, trace, activeCase, generateNotice, notices } = useTraceStore();
  const [tracingCaseId, setTracingCaseId] = useState<string | null>(null);
  const [updatingCase, setUpdatingCase] = useState<string | null>(null);
  const [assignModalCase, setAssignModalCase] = useState<StoredCase | null>(null);
  const [selectedIoId, setSelectedIoId] = useState<number>(3);
  const [selectedIoName, setSelectedIoName] = useState<string>("Sub-Inspector Patil");
  const [selectedPriority, setSelectedPriority] = useState<string>("HIGH");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const normRole = user ? normalizeRole(user.role) : null;
  const isSupervisor = normRole === "CYBERCRIME_SUPERVISOR" || user?.role === "WORKSPACE_ADMIN";
  const isSenior = normRole === "SENIOR_INVESTIGATOR" || Boolean(user?.is_gazetted);
  const isFieldIO = normRole === "INVESTIGATING_OFFICER" || user?.role === "NORMAL_INVESTIGATOR";

  // Filter cases relevant to user's assigned scope
  const assignedCases = useMemo(() => {
    if (!user) return cases;
    if (isSupervisor || isSenior) return cases;
    return cases.filter((c) => {
      const isAssigned =
        String(c.assigned_investigator_id) === String(user.id) ||
        (c.assigned_investigator_name && user.name && c.assigned_investigator_name.toLowerCase().includes(user.name.toLowerCase()));
      const isPendingInUnit =
        c.jurisdiction_code === user.jurisdiction_code &&
        (c.status === "PENDING_TRACING" || !c.assigned_investigator_id);
      return isAssigned || isPendingInUnit;
    });
  }, [cases, user, isSupervisor, isSenior]);

  const handleTraceClick = async (c: StoredCase) => {
    setTracingCaseId(c.case_number);
    try {
      setActiveCase(c);
      await runTrace(c.suspect_wallet_address, c);
      await loadCases();
      onGoToGraph?.();
    } catch {
      // Handled
    } finally {
      setTracingCaseId(null);
    }
  };

  const handleOpenAssignModal = (c: StoredCase) => {
    setAssignModalCase(c);
    setSelectedIoId(3);
    setSelectedIoName("Sub-Inspector Patil");
    setSelectedPriority(c.priority === "CRITICAL" ? "CRITICAL" : "HIGH");
  };

  const handleExecuteAssignment = async () => {
    if (!assignModalCase) return;
    setIsAssigning(true);
    try {
      const res = await fetch("/api/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_number: assignModalCase.case_number,
          assigned_investigator_id: selectedIoId,
          assigned_investigator_name: selectedIoName,
          priority: selectedPriority
        })
      });
      if (res.ok) {
        await loadCases();
        setAssignModalCase(null);
      }
    } catch {
      // Handled
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignIO = async (caseNumber: string, ioId: number, ioName: string) => {
    setUpdatingCase(caseNumber);
    try {
      const res = await fetch("/api/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_number: caseNumber,
          assigned_investigator_id: ioId,
          assigned_investigator_name: ioName
        })
      });
      if (res.ok) {
        await loadCases();
      }
    } catch {
      // Handled
    } finally {
      setUpdatingCase(null);
    }
  };

  const handleChangePriority = async (caseNumber: string, priority: string) => {
    setUpdatingCase(caseNumber);
    try {
      const res = await fetch("/api/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_number: caseNumber, priority })
      });
      if (res.ok) {
        await loadCases();
      }
    } catch {
      // Handled
    } finally {
      setUpdatingCase(null);
    }
  };

  // --------------------------------------------------------------------------
  // 1. CYBERCRIME SUPERVISOR DASHBOARD (SP Deshmukh)
  // State Unit Case Queue, Assigning IO (SI Patil), setting case priority, unit status
  // --------------------------------------------------------------------------
  if (isSupervisor) {
    const unallocated = cases.filter((c) => !c.assigned_investigator_id || c.status === "PENDING_TRACING").length;
    const tracedCount = cases.filter((c) => c.status === "TRACED").length;
    const frozenCount = cases.filter((c) => c.status === "FROZEN").length;

    return (
      <Page width="wide">
        {/* Supervisor Header */}
        <div
          className="rounded-2xl border p-5 mb-6 shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(59, 130, 246, 0.04))",
            borderColor: "rgba(168, 85, 247, 0.3)"
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-md"
                style={{ background: "#a855f7", color: "#000" }}
              >
                👮‍♂️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    State Cyber Crime Unit · Supervisory Command & Triage
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold">
                    SP DESHMUKH · UNIT TRIAGE
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Maharashtra Cyber Police Headquarters · BKC Mumbai &bull; Unit Case Allocation & Priority Oversight
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-200">
                Unit Scope: {user?.jurisdiction_code || "MH-CYBER-01"}
              </span>
            </div>
          </div>
        </div>

        {/* Unit Status KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">State Unit Cases</div>
            <div className="text-2xl font-bold text-white">{cases.length}</div>
            <div className="text-[11px] text-muted mt-1">Maharashtra Cyber Unit</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Needs Triage / Pending</div>
            <div className="text-2xl font-bold text-amber-400">{unallocated}</div>
            <div className="text-[11px] text-amber-300/80 mt-1">Awaiting IO action</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Blockchain Traces Active</div>
            <div className="text-2xl font-bold text-cyan-400">{tracedCount}</div>
            <div className="text-[11px] text-cyan-300/80 mt-1">Hops mapped by field IOs</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Escrow Freezes Locked</div>
            <div className="text-2xl font-bold text-emerald-400">{frozenCount}</div>
            <div className="text-[11px] text-emerald-300/80 mt-1">Secured at destination VASPs</div>
          </Card>
        </div>

        {/* State Unit Case Queue Table */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="text-sm font-bold text-white">Maharashtra Unit Triage & Allocation Queue</h2>
              <p className="text-xs text-muted">Assign field investigating officers (SI Patil) and set statutory case priority</p>
            </div>
            <span className="text-xs font-mono text-muted">{cases.length} Active Dockets</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-muted font-semibold uppercase text-[10px] tracking-wider" style={{ borderColor: "var(--border)" }}>
                  <th className="pb-3 pr-4">Case Docket</th>
                  <th className="pb-3 pr-4">Suspect Crypto Wallet</th>
                  <th className="pb-3 pr-4">Loss (INR)</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Assigned Field IO</th>
                  <th className="pb-3 pr-4">Priority</th>
                  <th className="pb-3 text-right">Supervisory Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cases.map((c) => {
                  const chain = detectChain(c.suspect_wallet_address);
                  const isUpdating = updatingCase === c.case_number;
                  const hasAssignedIO = Boolean(c.assigned_investigator_name || (c.assigned_investigator_id && c.assigned_investigator_id !== 0));
                  return (
                    <tr key={c.case_number} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 pr-4">
                        <div className="font-mono font-bold text-white">{c.case_number}</div>
                        <div className="text-[11px] text-muted truncate max-w-[180px]">{c.crime_type}</div>
                      </td>
                      <td className="py-3.5 pr-4 font-mono">
                        <div className="text-cyan-300 flex items-center gap-1.5">
                          <span>{shortWallet(c.suspect_wallet_address)}</span>
                          {chain && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                              style={{
                                background: `${chainColor(chain)}22`,
                                color: chainColor(chain)
                              }}
                            >
                              {CHAINS[chain].short}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted truncate">{c.target_vasp || "Binance Int."}</div>
                      </td>
                      <td className="py-3.5 pr-4 font-mono">
                        <div className="font-bold text-rose-400">{formatINR(c.loss_amount_inr ?? 0)}</div>
                        <div className="text-[10px] text-muted">{c.token_symbol || "USDT"}</div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <DashboardStatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 pr-4">
                        {hasAssignedIO ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-semibold text-white">
                              {c.assigned_investigator_name || (c.assigned_investigator_id === 3 ? "SI Patil" : "Assigned IO")}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                            ⚠️ Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        <select
                          disabled={isUpdating}
                          value={c.priority || "HIGH"}
                          onChange={(e) => void handleChangePriority(c.case_number, e.target.value)}
                          className={`rounded-lg border px-2 py-1 text-xs font-bold bg-[var(--chip)] focus:outline-none ${
                            c.priority === "CRITICAL"
                              ? "text-red-400 border-red-500/40"
                              : c.priority === "HIGH"
                              ? "text-amber-400 border-amber-500/40"
                              : "text-slate-300 border-slate-600"
                          }`}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleOpenAssignModal(c)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                        >
                          <span>👮‍♂️</span>
                          <span>Assign Case to Officer</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supervisor Case Assignment Modal */}
        {assignModalCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
              className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative"
              style={{ background: "#0e1420", borderColor: "rgba(168, 85, 247, 0.4)" }}
            >
              <button
                onClick={() => setAssignModalCase(null)}
                className="absolute right-4 top-4 text-muted hover:text-white text-base"
              >
                ✕
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 grid place-items-center text-lg">
                  👮‍♂️
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Assign Case to Investigating Officer</h2>
                  <p className="text-xs text-muted">Maharashtra Cyber Crime Police Headquarters · Unit Triage Desk</p>
                </div>
              </div>

              {/* Case Details Summary */}
              <div className="my-4 p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Case Docket:</span>
                  <span className="font-mono font-bold text-white">{assignModalCase.case_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Suspect Wallet:</span>
                  <span className="font-mono text-cyan-300">{shortWallet(assignModalCase.suspect_wallet_address)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Complainant:</span>
                  <span className="text-slate-200 font-medium">{assignModalCase.victim_name || "Rajesh Verma"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Claimed Loss:</span>
                  <span className="font-mono font-bold text-rose-400">{formatINR(assignModalCase.loss_amount_inr ?? 0)}</span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Select Investigating Officer <span className="text-purple-400">*</span>
                  </label>
                  <select
                    value={selectedIoId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setSelectedIoId(id);
                      const names: Record<number, string> = {
                        3: "Sub-Inspector Patil",
                        12: "Inspector Mehra",
                        14: "Inspector Gowda",
                        2: "ACP Sharma"
                      };
                      setSelectedIoName(names[id] || "Sub-Inspector Patil");
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-purple-500/30 bg-purple-950/30 text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-400"
                  >
                    <option value={3}>Sub-Inspector Patil (SI Patil · officer.patil@mhcyber.gov.in)</option>
                    <option value={12}>Inspector Mehra (inspector.mehra@mhcyber.gov.in)</option>
                    <option value={14}>Inspector Gowda (inspector.gowda@mhcyber.gov.in)</option>
                    <option value={2}>ACP Sharma (senior.sharma@mhcyber.gov.in · Gazetted)</option>
                  </select>
                  <p className="text-[11px] text-muted mt-1">
                    Designated field officer responsible for executing multi-hop tracing and preparing draft notice.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Investigation Priority Level <span className="text-purple-400">*</span>
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-white/15 bg-white/[0.04] text-white font-medium focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL — High-Risk Syndicate (Golden Window SLA)</option>
                    <option value="HIGH">HIGH — Active Attributable Fraud Flow</option>
                    <option value="MEDIUM">MEDIUM — Standard Investigation Queue</option>
                    <option value="LOW">LOW — Dormant / Delayed Complaint</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setAssignModalCase(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 text-muted transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteAssignment}
                    disabled={isAssigning}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>👮‍♂️</span>
                    <span>{isAssigning ? "Assigning Docket..." : `Assign Docket to ${selectedIoName}`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Page>
    );
  }

  // --------------------------------------------------------------------------
  // 2. SENIOR INVESTIGATOR DASHBOARD (ACP Sharma - Gazetted Officer)
  // Traced Cases Review, Money Flow Graph inspection, Digital Sign-off of Sec 94 BNSS Notice
  // --------------------------------------------------------------------------
  if (isSenior) {
    const readyForNotice = cases.filter((c) => c.status === "TRACED");
    const servedNotices = cases.filter((c) => c.status === "NOTICE_SERVED");
    const frozenCount = cases.filter((c) => c.status === "FROZEN").length;

    return (
      <Page width="wide">
        {/* Senior Investigator Header */}
        <div
          className="rounded-2xl border p-5 mb-6 shadow-lg"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.04))",
            borderColor: "rgba(16, 185, 129, 0.3)"
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
                    Gazetted Officer Legal Requisition Hub · Section 94 BNSS
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    ACP SHARMA (GAZETTED · SEC 94 BNSS AUTHORITY)
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Statutory Power: Sign & Issue Freeze Orders under Section 94 BNSS, 2023 &bull; Review Traced Cases
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onGoToNotices?.()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow flex items-center gap-1.5 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                <span>✍️</span>
                <span>Sign Legal Notices ({readyForNotice.length} Ready)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gazetted Status KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Traced Cases in Unit</div>
            <div className="text-2xl font-bold text-cyan-400">{readyForNotice.length}</div>
            <div className="text-[11px] text-cyan-300/80 mt-1">Ready for Section 94 Notice</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Directives Issued</div>
            <div className="text-2xl font-bold text-purple-400">{servedNotices.length}</div>
            <div className="text-[11px] text-purple-300/80 mt-1">Sec 94 BNSS served to VASPs</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Exchange Freezes Confirmed</div>
            <div className="text-2xl font-bold text-emerald-400">{frozenCount}</div>
            <div className="text-[11px] text-emerald-300/80 mt-1">Locked in VASP escrow</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Total Unit Dockets</div>
            <div className="text-2xl font-bold text-white">{cases.length}</div>
            <div className="text-[11px] text-muted mt-1">Maharashtra Cyber Unit</div>
          </Card>
        </div>

        {/* Traced Cases Review Queue */}
        <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="text-sm font-bold text-white">Traced Cases Review & Statutory Sign-Off Queue</h2>
              <p className="text-xs text-muted">Inspect blockchain money flow graphs and digitally authorize Section 94 BNSS freezing orders</p>
            </div>
          </div>

          <div className="space-y-3">
            {readyForNotice.length === 0 && (
              <div className="p-8 text-center text-xs text-muted">
                No cases currently awaiting Section 94 BNSS statutory sign-off.
              </div>
            )}
            {readyForNotice.map((c) => {
              const chain = detectChain(c.suspect_wallet_address);
              return (
                <div
                  key={c.case_number}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-white">{c.case_number}</span>
                      <DashboardStatusBadge status={c.status} />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {c.target_vasp || "Binance International"}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-cyan-200 truncate flex items-center gap-2">
                      <span>Suspect Wallet: {c.suspect_wallet_address}</span>
                      {chain && <span className="text-[10px] text-muted">({CHAINS[chain].name})</span>}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Complainant: <strong className="text-slate-300">{c.victim_name || "Citizen"}</strong> &bull; Loss:{" "}
                      <span className="text-rose-400 font-mono font-bold">{formatINR(c.loss_amount_inr ?? 0)}</span> &bull; IO:{" "}
                      <span className="text-slate-300">{c.assigned_investigator_name || "SI Patil"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 ml-auto">
                    <button
                      onClick={() => {
                        setActiveCase(c);
                        void runTrace(c.suspect_wallet_address, c);
                        onGoToGraph?.();
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🕸️</span>
                      <span>Inspect Graph</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveCase(c);
                        onGoToNotices?.();
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90 shadow-sm border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer"
                      style={{ background: "#059669" }}
                    >
                      <span>✍️</span>
                      <span>Sign Sec 94 Notice</span>
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

  // --------------------------------------------------------------------------
  // 3. INVESTIGATING OFFICER DASHBOARD (SI Patil - Field IO)
  // Assigned cases queue, Initiate Trace on Suspect Wallet, Money Flow Graph,
  // AI Forensics Copilot, Prepare Draft Notice. No supervisory approvals or admin tools.
  // --------------------------------------------------------------------------
  const pendingTraceCount = assignedCases.filter((c) => c.status === "PENDING_TRACING").length;
  const tracedWalletsCount = assignedCases.filter((c) => c.status === "TRACED").length;
  const activeTraceObj = trace;

  return (
    <Page width="wide">
      {/* Field IO Header */}
      <div
        className="rounded-2xl border p-5 mb-6 shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(59, 130, 246, 0.04))",
          borderColor: "rgba(245, 158, 11, 0.3)"
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-md"
              style={{ background: "#f59e0b", color: "#000" }}
            >
              🔍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Field Investigation & Tracing Console · SI Patil
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                  SUB-INSPECTOR PATIL · FIELD FORENSICS
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Maharashtra Cyber Crime Police Station · Assigned Dockets &bull; Multi-Hop BFS Trace & Draft Notice Preparation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200">
              Clearance: CONFIDENTIAL · Unit: MH-CYBER-01
            </span>
          </div>
        </div>
      </div>

      {/* Field IO Status KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Assigned Cases Queue</div>
          <div className="text-2xl font-bold text-white">{assignedCases.length}</div>
          <div className="text-[11px] text-muted mt-1">Assigned to SI Patil</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Awaiting Tracing</div>
          <div className="text-2xl font-bold text-amber-400">{pendingTraceCount}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Needs BFS trace execution</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Wallets Traced</div>
          <div className="text-2xl font-bold text-cyan-400">{tracedWalletsCount}</div>
          <div className="text-[11px] text-cyan-300/80 mt-1">Money flow topology mapped</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Freeze Directives Forwarded</div>
          <div className="text-2xl font-bold text-emerald-400">
            {assignedCases.filter((c) => c.status === "NOTICE_SERVED" || c.status === "FROZEN").length}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Submitted to ACP Sharma</div>
        </Card>
      </div>

      {/* Active Traced Wallet Summary (When available) */}
      {activeTraceObj && (
        <div
          className="rounded-2xl border p-5 mb-6 shadow-md"
          style={{
            background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(16, 185, 129, 0.05))",
            borderColor: "rgba(6, 182, 212, 0.3)"
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Active Trace Completed</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeTraceObj.nodes.length} Nodes Mapped
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Target VASP: Binance International
                </span>
              </div>
              <div className="font-mono text-sm text-white font-bold truncate">
                {activeTraceObj.seed}
              </div>
              <p className="text-xs text-muted mt-1">
                Money trail mapped through intermediate peel nodes directly to destination exchange deposit endpoint.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onGoToGraph?.()}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🕸️</span>
                <span>Blockchain Money Flow Graph</span>
              </button>
              <button
                onClick={() => onGoToChat?.()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-500/40 hover:bg-purple-500/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🤖</span>
                <span>AI Forensics Copilot</span>
              </button>
              <button
                onClick={() => {
                  if (activeCase && (!notices || !notices.some((n) => n.case_number === activeCase.case_number))) {
                    generateNotice(activeCase.target_vasp || "Binance International", activeCase.case_number);
                  }
                  onGoToNotices?.();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📝</span>
                <span>Prepare Draft Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Cases Queue */}
      <div className="rounded-2xl border p-5 shadow-sm" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-sm font-bold text-white">My Assigned Cases & Action Queue</h2>
            <p className="text-xs text-muted">Field investigator dockets — click Initiate Trace to run multi-hop blockchain BFS analysis</p>
          </div>
          <span className="text-xs font-mono text-muted">{assignedCases.length} Dockets</span>
        </div>

        <div className="space-y-3">
          {assignedCases.length === 0 && (
            <div className="p-8 text-center text-xs text-muted">
              No cases currently assigned to Sub-Inspector Patil. Cases assigned by SP Deshmukh will appear here.
            </div>
          )}

          {assignedCases.map((c) => {
            const chain = detectChain(c.suspect_wallet_address);
            const isTracingThis = tracingCaseId === c.case_number;
            return (
              <div
                key={c.case_number}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm text-white">{c.case_number}</span>
                    <DashboardStatusBadge status={c.status} />
                    {c.priority && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        c.priority === "CRITICAL"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {c.priority}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono text-cyan-200 truncate flex items-center gap-2">
                    <span>Suspect: {c.suspect_wallet_address}</span>
                    {chain && <span className="text-[10px] text-muted">({CHAINS[chain].name})</span>}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Complainant: <strong className="text-slate-300">{c.victim_name || "Citizen"}</strong> &bull; Loss:{" "}
                    <span className="text-rose-400 font-mono font-bold">{formatINR(c.loss_amount_inr ?? 0)}</span> ({c.token_symbol || "USDT"}) &bull; Modus:{" "}
                    <span className="text-slate-300 truncate">{c.crime_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  {c.status === "PENDING_TRACING" && (
                    <button
                      onClick={() => handleTraceClick(c)}
                      disabled={isTracingThis}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90 shadow-sm border border-emerald-500/40 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      style={{ background: "#059669" }}
                    >
                      <span>⚡</span>
                      <span>{isTracingThis ? "Tracing Suspect Wallet..." : "Initiate Trace on Suspect Wallet"}</span>
                    </button>
                  )}

                  {c.status === "TRACED" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveCase(c);
                          void runTrace(c.suspect_wallet_address, c);
                          onGoToGraph?.();
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🕸️</span>
                        <span>Money Flow Graph</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveCase(c);
                          void runTrace(c.suspect_wallet_address, c);
                          if (!notices || !notices.some((n) => n.case_number === c.case_number)) {
                            generateNotice(c.target_vasp || "Binance International", c.case_number);
                          }
                          onGoToNotices?.();
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>📝</span>
                        <span>Prepare Draft Notice</span>
                      </button>
                    </div>
                  )}

                  {(c.status === "NOTICE_SERVED" || c.status === "FROZEN") && (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                      <span>✓</span>
                      <span>{c.status === "FROZEN" ? "Assets Frozen in Escrow" : "Notice Forwarded to ACP"}</span>
                    </span>
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

function DashboardStatusBadge({ status }: { status: string }) {
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
          ⚖️ SEC 94 SERVED
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
