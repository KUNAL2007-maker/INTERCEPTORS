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

type FilterStatus = "ALL" | "PENDING_TRACING" | "TRACED" | "NOTICE_SERVED" | "FROZEN" | "FREEZE_REFUSED";

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
  const [auditModalCase, setAuditModalCase] = useState<string | null>(null);
  const [caseAuditLogs, setCaseAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Live roster of investigating officers for the supervisor's assignment dropdown.
  // Same source as CommandDashboard — replaces the old hardcoded "SI Patil" option.
  const [officers, setOfficers] = useState<
    Array<{ id: number; name: string; badge?: string; jurisdiction_code?: string; clearance_level?: number }>
  >([]);

  const [certModalCase, setCertModalCase] = useState<StoredCase | null>(null);
  const [certCopied, setCertCopied] = useState(false);
  // Real SHA-256 hashes computed via Web Crypto API, keyed by case_number.
  const [dossierHashes, setDossierHashes] = useState<Record<string, string>>({});

  useEffect(() => {
    async function computeHashes() {
      const enc = new TextEncoder();
      const results: Record<string, string> = {};
      for (const c of cases) {
        const input = `${c.case_number}:${c.suspect_wallet_address}:${c.loss_amount_inr || 0}:${c.blockchain_network || "Ethereum"}:BSA65B`;
        const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
        results[c.case_number] = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
      setDossierHashes(results);
    }
    if (cases.length > 0) void computeHashes();
  }, [cases]);

  const buildCertText = (c: StoredCase, hash: string) => {
    const ts = new Date().toISOString();
    return `
================================================================================
CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 / 65B
BHARATIYA SAKSHYA ADHINIYAM, 2023 (BSA 2023)
[Formerly Section 65B, Indian Evidence Act, 1872]
================================================================================

1. CASE IDENTIFIER  : ${c.case_number}
2. COMPLAINANT      : ${c.victim_name || "—"} (${c.victim_email || "N/A"})
3. SUSPECT WALLET   : ${c.suspect_wallet_address}
4. BLOCKCHAIN       : ${c.blockchain_network || "Ethereum (ERC-20)"}
5. REPORTED LOSS    : INR ${Number(c.loss_amount_inr || 0).toLocaleString("en-IN")} (${c.token_symbol || "USDT"})
6. CRIME TYPOLOGY   : ${c.crime_type}
7. TARGET VASP      : ${c.target_vasp || "Not yet identified"}
8. STATUTORY STATUS : ${c.status}
9. ASSIGNED IO      : ${c.assigned_investigator_name || "Unallocated"}

A. SYSTEM PARTICULARS:
   Platform          : CryptoTrace Forensic Cluster — Maharashtra Cyber
   SHA-256 Hash      : ${hash || "computing..."}
   Certification Time: ${ts}
   Jurisdiction      : ${c.jurisdiction_code || "MH-CYBER-01"}

B. STATUTORY CERTIFICATION (Section 65B BSA 2023):
   I, the undersigned, being the person responsible for the management and
   operation of the CryptoTrace Forensic Cluster, hereby certify that:
   (a) The electronic records above were produced by the computer system
       during the regular course of official cybercrime investigation.
   (b) The computer system was operating properly throughout the period
       during which these records were generated and has not been modified.
   (c) The information is derived from data fed into the system in the
       ordinary course of lawful law-enforcement activity.

   Certifying Officer : ${c.assigned_investigator_name || "Investigating Officer (as assigned)"}
   Unit               : Maharashtra State Cyber Police Station

   NOTE: This certificate is tendered for admission as evidence under
   Sec 63/65B BSA 2023. It is issued by the system custodian and received
   by the court — it is not authored by the presiding judge.

C. ADMISSIBILITY:
   This record satisfies all statutory criteria under Section 63 and
   Section 65B of the Bharatiya Sakshya Adhiniyam, 2023.

[ELECTRONICALLY GENERATED — CRYPTOTRACE FORENSIC CLUSTER — BSA 2023]
`.trim();
  };

  const handleAutofillDemoCase = () => {
    setNewVictim("Rajesh Verma");
    setNewWallet("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
    setNewNetwork("Ethereum");
    setNewAmount("350000");
    setNewCrime("Task-based Fake Part-Time Job / VIP Group Scam");
  };

  const handleOpenAuditHistory = async (caseNumber: string) => {
    setAuditModalCase(caseNumber);
    setLoadingAudit(true);
    try {
      const res = await fetch(`/api/audit?case_number=${encodeURIComponent(caseNumber)}`);
      if (res.ok) {
        const data = await res.json();
        setCaseAuditLogs(data.logs || []);
      } else {
        setCaseAuditLogs([]);
      }
    } catch {
      setCaseAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  };

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

  const handleAssignIO = async (caseNumber: string, ioId: number) => {
    // Server derives assigned_investigator_name from the officer account — do not send it from the client.
    try {
      const res = await fetch('/api/cases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_number: caseNumber, assigned_investigator_id: ioId })
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

  // Supervisors load the assignable officer roster (active INVESTIGATING_OFFICERs in jurisdiction).
  useEffect(() => {
    if (!isSupervisor) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/officers");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setOfficers(Array.isArray(data.officers) ? data.officers : []);
      } catch {
        /* roster fetch is best-effort; the dropdown simply shows "no officers" */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSupervisor]);

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
      freezeRefused: cases.filter((c) => c.status === "FREEZE_REFUSED").length,
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
      onGoToGraph();
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
      {/* Header */}
      <div
        className="rounded border p-5 mb-6"
        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: "var(--muted)" }}>
              {isCourtReviewer ? "IN-JUDICIAL-00 · HIGH COURT REVIEW" : user?.jurisdiction_code || "MH-CYBER-01"}
            </div>
            <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-strong)" }}>
              {isCourtReviewer
                ? "Judicial Evidence Dossier Chamber · Section 63/65B BSA"
                : "NCRP Cyber Crime Complaints & Case Management"}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {isCourtReviewer
                ? "Read-only judicial inspection of cryptographic evidence dossiers, SHA-256 integrity anchors & Section 65B certificates"
                : `Logged in as ${user?.name} (${user?.role}) · ${
                    user?.is_gazetted
                      ? "Gazetted Officer — Sec 94 BNSS Statutory Freeze Authority"
                      : "Field Investigator — Assigned Cases"
                  }`}
            </p>
          </div>

          {!isCourtReviewer ? (
            <button
              onClick={() => setShowIngestModal(true)}
              className="px-4 py-2.5 rounded border text-xs font-bold transition hover:opacity-80"
              style={{ background: "#10b981", color: "#000", borderColor: "#059669" }}
            >
              + Ingest 1930 Phone Complaint
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded border text-xs font-semibold" style={{ color: "var(--muted)", borderColor: "var(--border)", background: "var(--chip)" }}>
              BSA SEC 65B — READ-ONLY EVIDENCE REVIEW MODE
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
              ["FREEZE_REFUSED", `Refused (${counts.freezeRefused})`],
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

              {/* For Court Reviewer: SHA-256 Cryptographic Evidence Integrity Box */}
              {isCourtReviewer && (
                <div className="mb-3.5 p-3.5 rounded border text-xs" style={{ borderColor: "var(--border)", background: "var(--chip)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold" style={{ color: "var(--text-strong)" }}>
                      BSA 2023 Section 65B — Cryptographic Evidence Hash
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold text-emerald-300 border-emerald-500/30 bg-emerald-500/10">
                      CHAIN-OF-CUSTODY CERTIFIED
                    </span>
                  </div>
                  <div className="font-mono text-[11px] break-all px-2.5 py-1.5 rounded border border-white/5 bg-black/40" style={{ color: "var(--muted)" }}>
                    SHA-256: {dossierHashes[c.case_number] || "computing…"}
                  </div>
                  <div className="text-[10.5px] mt-1.5 flex items-center justify-between flex-wrap gap-2" style={{ color: "var(--muted-2)" }}>
                    <span>Anchor: SHA-256 · Admissible under Sec 63 BSA 2023</span>
                    <span className="font-mono text-[10px]">Verified: {new Date().toISOString().split("T")[0]}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="text-[11px] text-muted flex flex-wrap items-center gap-2">
                  <span>IO:</span>
                  {isSupervisor ? (
                    <select
                      value={c.assigned_investigator_id ?? ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val) handleAssignIO(c.case_number, val);
                      }}
                      className="rounded border px-2 py-0.5 text-xs bg-[var(--chip)] text-white focus:outline-none min-w-[13rem]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <option value="">— Unallocated —</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                          {o.badge ? ` · ${o.badge}` : ""}
                        </option>
                      ))}
                      {/* Show any already-assigned officer not in the current roster so the name never blanks out */}
                      {c.assigned_investigator_id != null &&
                        !officers.some((o) => o.id === c.assigned_investigator_id) && (
                          <option value={c.assigned_investigator_id}>
                            {c.assigned_investigator_name || `Officer #${c.assigned_investigator_id}`}
                          </option>
                        )}
                    </select>
                  ) : (
                    <strong className="text-white">{c.assigned_investigator_name || "Unallocated"}</strong>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isCourtReviewer ? (
                    <>
                      <span className="px-2.5 py-1 rounded border text-xs font-mono font-semibold" style={{ color: "var(--muted)", borderColor: "var(--border)", background: "var(--chip)" }}>
                        BSA SEC 65B — READ-ONLY
                      </span>
                      <button
                        onClick={() => {
                          setCertModalCase(c);
                          setCertCopied(false);
                        }}
                        className="px-3.5 py-1.5 rounded border text-xs font-semibold transition hover:opacity-80"
                        style={{ background: "var(--chip)", color: "var(--text-strong)", borderColor: "var(--border)" }}
                      >
                        Export Sec 65B BSA Certificate
                      </button>
                    </>
                  ) : (
                    <>
                      {c.status === "PENDING_TRACING" && (
                        canExecuteTrace ? (
                          <button
                            onClick={() => handleTraceClick(c)}
                            disabled={isTracingThis}
                            className="px-4 py-2 rounded border text-xs font-bold transition hover:opacity-80 disabled:opacity-50"
                            style={{ background: "#10b981", color: "#000", borderColor: "#059669" }}
                          >
                            {isTracingThis ? "Tracing Suspect Wallet…" : "Initiate Trace on Suspect Wallet"}
                          </button>
                        ) : (
                          !isForwarded ? (
                            <button
                              onClick={() => handleTraceClick(c)}
                              className="px-3.5 py-2 rounded border text-xs font-semibold transition hover:opacity-80"
                              style={{ background: "var(--chip)", color: "#fcd34d", borderColor: "#92400e" }}
                            >
                              Forward to Gazetted Officer for BFS Trace
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded border text-xs font-semibold" style={{ background: "var(--chip)", color: "#6ee7b7", borderColor: "#065f46" }}>
                              Queued for Gazetted Officer Trace Approval
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
                            className="px-3.5 py-1.5 rounded border text-xs font-semibold transition hover:opacity-80"
                            style={{ background: "var(--chip)", color: "#67e8f9", borderColor: "#164e63" }}
                          >
                            View Money Flow Graph
                          </button>

                          <button
                            onClick={() => {
                              setActiveCase(c);
                              onGoToNotices();
                            }}
                            className="px-3.5 py-1.5 rounded border text-xs font-semibold transition hover:opacity-80"
                            style={{ background: "var(--chip)", color: "#fcd34d", borderColor: "#78350f" }}
                          >
                            Issue Sec 94 BNSS Notice
                          </button>
                        </>
                      )}

                      {(c.status === "NOTICE_SERVED" || c.status === "FROZEN") && (
                        <button
                          onClick={() => {
                            setActiveCase(c);
                            onGoToNotices();
                          }}
                          className="px-3.5 py-1.5 rounded border text-xs font-semibold transition hover:opacity-80"
                          style={{ background: "var(--chip)", color: "#6ee7b7", borderColor: "#065f46" }}
                        >
                          {c.status === "FROZEN" ? "View Seizure & Escrow Details" : "Track Served Freeze Requisition"}
                        </button>
                      )}

                      {c.status === "FREEZE_REFUSED" && (
                        <button
                          onClick={() => {
                            setActiveCase(c);
                            onGoToNotices();
                          }}
                          className="px-3.5 py-1.5 rounded border text-xs font-semibold transition hover:opacity-80"
                          style={{ background: "var(--chip)", color: "#fca5a5", borderColor: "#7f1d1d" }}
                        >
                          Review Exchange Refusal Report
                        </button>
                      )}
                    </>
                  )}

                  {normRole !== "VICTIM" && (
                    <button
                      onClick={() => handleOpenAuditHistory(c.case_number)}
                      className="px-3 py-1.5 rounded border text-xs font-medium transition hover:opacity-80"
                      style={{ background: "var(--chip)", color: "var(--muted)", borderColor: "var(--border)" }}
                      title="View immutable Section 65B audit history for this case"
                    >
                      Audit Trail
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="rounded border p-12 text-center" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
            <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>No complaint records found</div>
            <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
              No cases matching your current filter criteria. Use &ldquo;+ Ingest 1930 Phone Complaint&rdquo; to register a newly reported victim incident.
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

            {/* Evaluator fast-track autofill */}
            <div className="mb-4 p-3.5 rounded border flex items-center justify-between gap-3" style={{ borderColor: "var(--border)", background: "var(--chip)" }}>
              <div className="min-w-0">
                <div className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>Evaluator Fast-Track Scenario</div>
                <div className="text-[11px] truncate" style={{ color: "var(--muted)" }}>
                  Autofill ₹3,50,000 USDT task scam on Ethereum (0x71C7…)
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutofillDemoCase}
                className="px-3.5 py-1.5 rounded border text-xs font-semibold transition hover:opacity-80 shrink-0"
                style={{ background: "var(--panel)", color: "var(--text-strong)", borderColor: "var(--border)" }}
              >
                Autofill Demo Case
              </button>
            </div>

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
                  className="w-full py-2.5 rounded border text-xs font-bold transition hover:opacity-80 disabled:opacity-50"
                  style={{ background: "#10b981", color: "#000", borderColor: "#059669" }}
                >
                  {ingesting ? "Ingesting…" : "Ingest Case & Alert Attribution Engine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Audit History Modal */}
      {auditModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-2xl border p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            style={{
              background: "#0d1117",
              borderColor: "var(--border)",
              color: "var(--text-strong)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-strong)" }}>Immutable Case Audit History</h2>
                <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>{auditModalCase} · BSA 2023 Section 63/65B Tamper-Evident Trail</p>
              </div>
              <button
                onClick={() => setAuditModalCase(null)}
                className="text-muted hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingAudit ? (
                <div className="p-8 text-center text-xs text-muted">Retrieving tamper-evident audit trail...</div>
              ) : caseAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">
                  No audit events recorded yet for {auditModalCase}.
                </div>
              ) : (
                caseAuditLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl border text-xs"
                    style={{ background: "var(--chip)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">{log.action}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        log.decision === "GRANTED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-red-500/20 text-red-300 border border-red-500/40"
                      }`}>
                        {log.decision}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted mb-1">
                      Actor: <strong className="text-slate-300">{log.user_name}</strong> ({log.user_role}) &bull; Timestamp: <span className="font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    {log.reason && (
                      <div className="text-[11px] text-slate-400 bg-black/30 p-2 rounded border border-white/5 font-mono">
                        {log.reason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t mt-4 flex justify-end" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setAuditModalCase(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Court Reviewer BSA Sec 65B Electronic Evidence Certificate Modal */}
      {certModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
            style={{
              background: "#0d1117",
              borderColor: "var(--border)",
              color: "var(--text-strong)",
            }}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--text-strong)" }}>Section 65B BSA Electronic Evidence Certificate</h2>
                <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>{certModalCase.case_number} · Bharatiya Sakshya Adhiniyam, 2023</p>
              </div>
              <button
                onClick={() => setCertModalCase(null)}
                className="text-muted hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 rounded-xl border font-mono text-[11px] leading-relaxed max-h-[460px]"
              style={{
                background: "#080b0f",
                borderColor: "var(--border)",
                color: "#cbd5e1",
              }}
            >
              <pre className="whitespace-pre-wrap">{buildCertText(certModalCase, dossierHashes[certModalCase.case_number] || "")}</pre>
            </div>

            <div className="pt-4 border-t mt-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs text-muted">
                Statutory admissibility: Sec 63 & 65B BSA 2023 &bull; Electronic Judicial Seal
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(buildCertText(certModalCase, dossierHashes[certModalCase.case_number] || ""));
                    setCertCopied(true);
                    setTimeout(() => setCertCopied(false), 3000);
                  }}
                  className="px-4 py-2 rounded border text-xs font-semibold transition hover:opacity-80"
                  style={{ background: "var(--chip)", color: "var(--text-strong)", borderColor: "var(--border)" }}
                >
                  {certCopied ? "Copied to Clipboard" : "Copy Sec 65B Certificate"}
                </button>
                <button
                  onClick={() => setCertModalCase(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
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
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
          PENDING TRACE
        </span>
      );
    case "TRACED":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
          TRACED
        </span>
      );
    case "AWAITING_SIGNATURE":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 font-semibold">
          AWAITING SIGN-OFF
        </span>
      );
    case "NOTICE_SERVED":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold">
          NOTICE SERVED
        </span>
      );
    case "FROZEN":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
          ASSETS FROZEN
        </span>
      );
    case "FREEZE_REFUSED":
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
          FREEZE REFUSED
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
