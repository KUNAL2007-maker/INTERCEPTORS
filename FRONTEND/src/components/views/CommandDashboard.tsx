"use client";

import { useEffect, useMemo, useState } from "react";
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

/** An assignable officer, as /api/officers returns them. */
type Officer = {
  id: number;
  name: string;
  badge?: string;
  jurisdiction_code?: string | null;
  clearance_level?: string;
};

export function CommandDashboard({
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
  const { cases, loadCases, runTrace, setActiveCase, trace, activeCase } = useTraceStore();
  const [tracingCaseId, setTracingCaseId] = useState<string | null>(null);
  const [updatingCase, setUpdatingCase] = useState<string | null>(null);

  const normRole = user ? normalizeRole(user.role) : null;
  const isSupervisor = normRole === "CYBERCRIME_SUPERVISOR" || user?.role === "WORKSPACE_ADMIN";
  const isSenior = normRole === "SENIOR_INVESTIGATOR" || Boolean(user?.is_gazetted);
  const isFieldIO = normRole === "INVESTIGATING_OFFICER" || user?.role === "NORMAL_INVESTIGATOR";

  // Allocation state. `pendingAssign` holds the officer the supervisor has
  // picked but not yet committed, per case; `assignError` surfaces a server
  // rejection (wrong jurisdiction, no such officer) inline on the row rather
  // than swallowing it as the old control did.
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officersError, setOfficersError] = useState<string | null>(null);
  const [pendingAssign, setPendingAssign] = useState<Record<string, number>>({});
  const [assignError, setAssignError] = useState<Record<string, string>>({});

  // The assignable-officer directory is a supervisory resource, so only fetch it
  // for a supervisor. It returns exactly the officers this PATCH will accept -
  // active Investigating Officers in the caller's jurisdiction - which is why
  // the control can no longer offer someone the server then refuses.
  useEffect(() => {
    if (!isSupervisor) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/officers");
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (res.ok && Array.isArray(data.officers)) {
          setOfficers(data.officers);
          setOfficersError(null);
        } else {
          setOfficersError(data?.error || "Could not load the officer directory.");
        }
      } catch {
        if (mounted) setOfficersError("Could not reach the officer directory.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isSupervisor, user?.jurisdiction_code]);

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
    } catch {
      // Handled
    } finally {
      setTracingCaseId(null);
    }
  };

  /**
   * Allocate (or reallocate) a case to an officer. The officer's name is not
   * sent: the server derives it from the account so the audit trail cannot be
   * made to record a different officer than the one allocated. A rejection is
   * shown on the row instead of being discarded.
   */
  const handleAssignIO = async (caseNumber: string, ioId: number) => {
    setUpdatingCase(caseNumber);
    setAssignError((p) => {
      const n = { ...p };
      delete n[caseNumber];
      return n;
    });
    try {
      const res = await fetch("/api/cases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_number: caseNumber, assigned_investigator_id: ioId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPendingAssign((p) => {
          const n = { ...p };
          delete n[caseNumber];
          return n;
        });
        await loadCases();
      } else {
        setAssignError((p) => ({ ...p, [caseNumber]: data?.error || "Assignment was rejected by the server." }));
      }
    } catch {
      setAssignError((p) => ({ ...p, [caseNumber]: "Could not reach the case service." }));
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
  // 1. CYBERCRIME SUPERVISOR DASHBOARD
  // State unit case queue, allocating an Investigating Officer, setting priority.
  // --------------------------------------------------------------------------
  if (isSupervisor) {
    const unallocated = cases.filter((c) => !c.assigned_investigator_id || c.status === "PENDING_TRACING").length;
    const tracedCount = cases.filter((c) => c.status === "TRACED").length;
    const frozenCount = cases.filter((c) => c.status === "FROZEN").length;

    return (
      <Page width="wide">
        <RoleHeader
          eyebrow="State Cyber Crime Unit · Supervisory Command & Triage"
          title="Unit Case Allocation & Priority Oversight"
          subtitle="Review incoming complaints, allocate a field Investigating Officer, and set statutory case priority."
          user={user}
        />

        {/* Unit Status KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Unit Cases</div>
            <div className="text-2xl font-bold text-white">{cases.length}</div>
            <div className="text-[11px] text-muted mt-1">{user?.jurisdiction_code || "Assigned unit"}</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Needs Triage / Pending</div>
            <div className="text-2xl font-bold text-amber-400">{unallocated}</div>
            <div className="text-[11px] text-amber-300/80 mt-1">Awaiting allocation or trace</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Blockchain Traces Active</div>
            <div className="text-2xl font-bold text-cyan-400">{tracedCount}</div>
            <div className="text-[11px] text-cyan-300/80 mt-1">Hops mapped by field officers</div>
          </Card>
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Escrow Freezes Locked</div>
            <div className="text-2xl font-bold text-emerald-400">{frozenCount}</div>
            <div className="text-[11px] text-emerald-300/80 mt-1">Secured at destination VASPs</div>
          </Card>
        </div>

        {/* State Unit Case Queue Table */}
        <div className="rounded border p-5" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="text-sm font-semibold text-white">Triage & Allocation Queue</h2>
              <p className="text-xs text-muted">Allocate a field Investigating Officer and set statutory case priority.</p>
            </div>
            <span className="text-xs font-mono text-muted">{cases.length} active dockets</span>
          </div>

          {officersError && (
            <div className="mb-3 rounded border px-3 py-2 text-[11px] text-amber-200" style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)" }}>
              {officersError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-muted font-semibold uppercase text-[10px] tracking-wider" style={{ borderColor: "var(--border)" }}>
                  <th className="pb-3 pr-4">Case Docket</th>
                  <th className="pb-3 pr-4">Suspect Crypto Wallet</th>
                  <th className="pb-3 pr-4">Loss (INR)</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Allocation</th>
                  <th className="pb-3">Case Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cases.map((c) => {
                  const chain = detectChain(c.suspect_wallet_address);
                  const isUpdating = updatingCase === c.case_number;
                  const current = c.assigned_investigator_id ?? null;
                  const pending = pendingAssign[c.case_number];
                  const canAssign = pending != null && pending !== current;
                  return (
                    <tr key={c.case_number} className="hover:bg-white/[0.02] transition align-top">
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
                        {c.target_vasp && <div className="text-[10px] text-muted truncate">{c.target_vasp}</div>}
                      </td>
                      <td className="py-3.5 pr-4 font-mono">
                        <div className="font-bold text-rose-400">{formatINR(c.loss_amount_inr ?? 0)}</div>
                        {c.token_symbol && <div className="text-[10px] text-muted">{c.token_symbol}</div>}
                      </td>
                      <td className="py-3.5 pr-4">
                        <DashboardStatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 pr-4 min-w-[240px]">
                        {current ? (
                          <div className="mb-1.5">
                            <div className="text-white font-semibold">{c.assigned_investigator_name}</div>
                            <div className="text-[10px]" style={{ color: "var(--muted)" }}>Allocated</div>
                          </div>
                        ) : (
                          <div className="mb-1.5">
                            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border text-amber-300 border-amber-500/40 bg-amber-500/10">
                              Unallocated
                            </span>
                          </div>
                        )}

                        {officers.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <select
                              disabled={isUpdating}
                              value={pending ?? current ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setPendingAssign((p) => {
                                  const n = { ...p };
                                  if (v) n[c.case_number] = Number(v);
                                  else delete n[c.case_number];
                                  return n;
                                });
                              }}
                              className="rounded border px-2 py-1 text-xs font-semibold focus:outline-none"
                              style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text-strong)" }}
                            >
                              <option value="">Select officer…</option>
                              {officers.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name}{o.badge ? ` · ${o.badge}` : ""}
                                </option>
                              ))}
                            </select>
                            <button
                              disabled={isUpdating || !canAssign}
                              onClick={() => canAssign && pending != null && handleAssignIO(c.case_number, pending)}
                              className="rounded px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40 cursor-pointer"
                              style={{ background: "#047857" }}
                            >
                              {isUpdating ? "Assigning…" : current ? "Reassign" : "Assign"}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                            {officersError || "No Investigating Officers available in this unit."}
                          </div>
                        )}

                        {assignError[c.case_number] && (
                          <div className="mt-1 text-[11px] text-rose-300">{assignError[c.case_number]}</div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <select
                          disabled={isUpdating}
                          value={c.priority || "HIGH"}
                          onChange={(e) => void handleChangePriority(c.case_number, e.target.value)}
                          className={`rounded border px-2 py-1 text-xs font-bold bg-[var(--chip)] focus:outline-none ${
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Page>
    );
  }

  // --------------------------------------------------------------------------
  // 2. SENIOR / GAZETTED OFFICER DASHBOARD
  // Traced-case review, money-flow graph inspection, Section 94 BNSS sign-off.
  // --------------------------------------------------------------------------
  if (isSenior) {
    const readyForNotice = cases.filter((c) => c.status === "TRACED");
    const servedNotices = cases.filter((c) => c.status === "NOTICE_SERVED");
    const frozenCount = cases.filter((c) => c.status === "FROZEN").length;

    return (
      <Page width="wide">
        <RoleHeader
          eyebrow="Gazetted Officer · Section 94 BNSS Authority"
          title="Legal Requisition & Statutory Sign-Off Hub"
          subtitle="Review traced cases and digitally sign & issue freeze orders under Section 94 BNSS, 2023."
          user={user}
          right={
            <button
              onClick={() => onGoToNotices?.()}
              className="rounded px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 cursor-pointer"
              style={{ background: "#047857" }}
            >
              Sign legal notices ({readyForNotice.length} ready)
            </button>
          }
        />

        {/* Gazetted Status KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Traced Cases in Unit</div>
            <div className="text-2xl font-bold text-cyan-400">{readyForNotice.length}</div>
            <div className="text-[11px] text-cyan-300/80 mt-1">Ready for Section 94 notice</div>
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
            <div className="text-[11px] text-muted mt-1">{user?.jurisdiction_code || "Assigned unit"}</div>
          </Card>
        </div>

        {/* Traced Cases Review Queue */}
        <div className="rounded border p-5" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="text-sm font-semibold text-white">Traced Cases · Statutory Sign-Off Queue</h2>
              <p className="text-xs text-muted">Inspect the money-flow graph and digitally authorise Section 94 BNSS freezing orders.</p>
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
                  className="p-4 rounded border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-white">{c.case_number}</span>
                      <DashboardStatusBadge status={c.status} />
                      {c.target_vasp && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                          {c.target_vasp}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-cyan-200 truncate flex items-center gap-2">
                      <span>Suspect wallet: {c.suspect_wallet_address}</span>
                      {chain && <span className="text-[10px] text-muted">({CHAINS[chain].name})</span>}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Complainant: <strong className="text-slate-300">{c.victim_name || "Citizen"}</strong> &bull; Loss:{" "}
                      <span className="text-rose-400 font-mono font-bold">{formatINR(c.loss_amount_inr ?? 0)}</span> &bull; IO:{" "}
                      <span className="text-slate-300">{c.assigned_investigator_name || "Unallocated"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 ml-auto">
                    <button
                      onClick={() => {
                        setActiveCase(c);
                        void runTrace(c.suspect_wallet_address, c);
                        onGoToGraph?.();
                      }}
                      className="rounded border px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 cursor-pointer"
                      style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text-strong)" }}
                    >
                      Inspect graph
                    </button>
                    <button
                      onClick={() => {
                        setActiveCase(c);
                        onGoToNotices?.();
                      }}
                      className="rounded px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 cursor-pointer"
                      style={{ background: "#047857" }}
                    >
                      Sign Sec 94 notice
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
  // 3. INVESTIGATING OFFICER DASHBOARD (Field IO)
  // Assigned-case queue, initiate trace, money-flow graph, copilot, draft notice.
  // --------------------------------------------------------------------------
  const pendingTraceCount = assignedCases.filter((c) => c.status === "PENDING_TRACING").length;
  const tracedWalletsCount = assignedCases.filter((c) => c.status === "TRACED").length;
  const activeTraceObj = trace;

  return (
    <Page width="wide">
      <RoleHeader
        eyebrow="Field Investigation & Tracing Console"
        title="Assigned Dockets · Multi-Hop Trace & Draft Notice"
        subtitle="Run multi-hop blockchain tracing on assigned suspect wallets and prepare draft requisitions."
        user={user}
        right={
          <span
            className="text-xs font-mono px-3 py-1.5 rounded border"
            style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--muted)" }}
          >
            {(user?.clearance_level || "RESTRICTED")} · {user?.jurisdiction_code || "Unassigned unit"}
          </span>
        }
      />

      {/* Field IO Status KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Assigned Cases Queue</div>
          <div className="text-2xl font-bold text-white">{assignedCases.length}</div>
          <div className="text-[11px] text-muted mt-1">In your assigned queue</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Awaiting Tracing</div>
          <div className="text-2xl font-bold text-amber-400">{pendingTraceCount}</div>
          <div className="text-[11px] text-amber-300/80 mt-1">Needs trace execution</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Wallets Traced</div>
          <div className="text-2xl font-bold text-cyan-400">{tracedWalletsCount}</div>
          <div className="text-[11px] text-cyan-300/80 mt-1">Money-flow topology mapped</div>
        </Card>
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Freeze Directives Forwarded</div>
          <div className="text-2xl font-bold text-emerald-400">
            {assignedCases.filter((c) => c.status === "NOTICE_SERVED" || c.status === "FROZEN").length}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Forwarded for gazetted sign-off</div>
        </Card>
      </div>

      {/* Active Traced Wallet Summary (When available) */}
      {activeTraceObj && (
        <div className="rounded border p-5 mb-6" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">Active trace completed</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                  {activeTraceObj.nodes.length} nodes mapped
                </span>
                {activeCase?.target_vasp && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-purple-500/10 text-purple-300 border-purple-500/30">
                    Target VASP: {activeCase.target_vasp}
                  </span>
                )}
              </div>
              <div className="font-mono text-sm text-white font-bold truncate">
                {activeTraceObj.seed}
              </div>
              <p className="text-xs text-muted mt-1">
                Money trail mapped through intermediate peel nodes to the destination exchange deposit endpoint.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onGoToGraph?.()}
                className="rounded border px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 cursor-pointer"
                style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text-strong)" }}
              >
                Money-flow graph
              </button>
              <button
                onClick={() => onGoToChat?.()}
                className="rounded border px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 cursor-pointer"
                style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text-strong)" }}
              >
                AI forensics copilot
              </button>
              <button
                onClick={() => onGoToNotices?.()}
                className="rounded border px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 cursor-pointer"
                style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text-strong)" }}
              >
                Prepare draft notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Cases Queue */}
      <div className="rounded border p-5" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4 border-b pb-3" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-sm font-semibold text-white">My Assigned Cases & Action Queue</h2>
            <p className="text-xs text-muted">Click Initiate Trace to run multi-hop blockchain analysis on the suspect wallet.</p>
          </div>
          <span className="text-xs font-mono text-muted">{assignedCases.length} dockets</span>
        </div>

        <div className="space-y-3">
          {assignedCases.length === 0 && (
            <div className="p-8 text-center text-xs text-muted">
              No cases currently assigned to you. Cases allocated by your supervisor will appear here.
            </div>
          )}

          {assignedCases.map((c) => {
            const chain = detectChain(c.suspect_wallet_address);
            const isTracingThis = tracingCaseId === c.case_number;
            return (
              <div
                key={c.case_number}
                className="p-4 rounded border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-sm text-white">{c.case_number}</span>
                    <DashboardStatusBadge status={c.status} />
                    {c.priority && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        c.priority === "CRITICAL"
                          ? "bg-red-500/10 text-red-300 border-red-500/30"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
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
                    <span className="text-rose-400 font-mono font-bold">{formatINR(c.loss_amount_inr ?? 0)}</span>
                    {c.token_symbol ? ` (${c.token_symbol})` : ""} &bull; Modus:{" "}
                    <span className="text-slate-300 truncate">{c.crime_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  {c.status === "PENDING_TRACING" && (
                    <button
                      onClick={() => handleTraceClick(c)}
                      disabled={isTracingThis}
                      className="rounded px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                      style={{ background: "#047857" }}
                    >
                      {isTracingThis ? "Tracing suspect wallet…" : "Initiate Trace on Suspect Wallet"}
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
                        className="rounded border px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 cursor-pointer"
                        style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text-strong)" }}
                      >
                        Money-flow graph
                      </button>
                      <button
                        onClick={() => {
                          setActiveCase(c);
                          void runTrace(c.suspect_wallet_address, c);
                          onGoToNotices?.();
                        }}
                        className="rounded border px-3.5 py-2 text-xs font-semibold transition hover:opacity-90 cursor-pointer"
                        style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text-strong)" }}
                      >
                        Prepare draft notice
                      </button>
                    </div>
                  )}

                  {(c.status === "NOTICE_SERVED" || c.status === "FROZEN") && (
                    <span className="px-3 py-1.5 rounded border bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs font-semibold">
                      {c.status === "FROZEN" ? "Assets frozen in escrow" : "Notice forwarded for sign-off"}
                    </span>
                  )}

                  {c.status === "FREEZE_REFUSED" && (
                    <span className="px-3 py-1.5 rounded border bg-rose-500/10 text-rose-300 border-rose-500/30 text-xs font-semibold">
                      Exchange declined freeze
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

/**
 * Formal role header. Replaces the three gradient banners (one per role) that
 * carried an emoji tile and a hard-coded persona name. The eyebrow/title read
 * as a document header; the officer chip on the right reflects whoever is
 * actually signed in rather than naming a fixed demo persona.
 */
function RoleHeader({
  eyebrow,
  title,
  subtitle,
  user,
  right,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  user: { name?: string; badge?: string } | null;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded border p-5 mb-6" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            {eyebrow}
          </div>
          <h1 className="mt-1 text-lg font-semibold leading-tight" style={{ color: "var(--text-strong)" }}>
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{subtitle}</p>}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {right}
          {user?.name && (
            <span
              className="text-xs font-mono px-3 py-1.5 rounded border"
              style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--muted)" }}
            >
              {user.name}{user.badge ? ` · ${user.badge}` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardStatusBadge({ status }: { status: string }) {
  const M: Record<string, { label: string; cls: string }> = {
    PENDING_TRACING: { label: "Pending trace", cls: "text-amber-300 border-amber-500/40 bg-amber-500/10" },
    TRACED: { label: "Traced", cls: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10" },
    NOTICE_SERVED: { label: "Sec 94 served", cls: "text-purple-300 border-purple-500/40 bg-purple-500/10" },
    FROZEN: { label: "Assets frozen", cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
    FREEZE_REFUSED: { label: "Freeze refused", cls: "text-rose-300 border-rose-500/40 bg-rose-500/10" },
    ESCALATED: { label: "Escalated", cls: "text-indigo-300 border-indigo-500/40 bg-indigo-500/10" },
    RECOVERED: { label: "Recovered", cls: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10" },
  };
  const m = M[status];
  const cls = m ? m.cls : "text-slate-300 border-slate-700 bg-slate-800/40";
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold uppercase tracking-wider ${cls}`}>
      {m ? m.label : status}
    </span>
  );
}
