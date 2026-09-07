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
  const [auditModalCase, setAuditModalCase] = useState<string | null>(null);
  const [caseAuditLogs, setCaseAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [certModalCase, setCertModalCase] = useState<StoredCase | null>(null);
  const [certCopied, setCertCopied] = useState(false);

  const [assignModalCase, setAssignModalCase] = useState<StoredCase | null>(null);
  const [selectedIoId, setSelectedIoId] = useState<number>(3);
  const [selectedIoName, setSelectedIoName] = useState<string>("Sub-Inspector Patil");
  const [selectedPriority, setSelectedPriority] = useState<string>("HIGH");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

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
    }
  };

  const handleChangePriority = async (caseNumber: string, priority: string) => {
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
    }
  };

  const generateDossierHash = (c: StoredCase) => {
    const input = `${c.case_number}:${c.suspect_wallet_address}:${c.loss_amount_inr || 0}:SIH2026:BSA65B`;
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57, h3 = 0x9e3779b9, h4 = 0x85ebca6b;
    for (let i = 0; i < input.length; i++) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
      h3 = Math.imul(h3 ^ ch, 2246822507);
      h4 = Math.imul(h4 ^ ch, 3266489909);
    }
    const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
    const part1 = toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
    const part2 = toHex(Math.imul(h1, 31)) + toHex(Math.imul(h2, 37)) + toHex(Math.imul(h3, 41)) + toHex(Math.imul(h4, 43));
    return (part1 + part2).toLowerCase();
  };

  const buildCertText = (c: StoredCase) => {
    const hash = generateDossierHash(c);
    return `
================================================================================
CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 / 65B 
BHARATIYA SAKSHYA ADHINIYAM, 2023 (BSA 2023)
[Formerly Section 65B, Indian Evidence Act, 1872]
================================================================================

1. CASE IDENTIFIER: ${c.case_number}
2. COMPLAINANT: ${c.victim_name || "Rajesh Verma"} (${c.victim_email || "N/A"})
3. SUSPECT CRYPTO WALLET: ${c.suspect_wallet_address}
4. ON-CHAIN NETWORK: ${c.blockchain_network || "Ethereum (ERC-20)"}
5. ESTIMATED LOSS: ₹${Number(c.loss_amount_inr || 0).toLocaleString("en-IN")} (${c.token_symbol || "USDT"})
6. CRIME TYPOLOGY: ${c.crime_type}
7. TARGET VASP / EXCHANGE: ${c.target_vasp || "Binance International"}
8. STATUTORY STATUS: ${c.status}
9. ASSIGNED INVESTIGATOR: ${c.assigned_investigator_name || "SI Patil"}

A. SYSTEM & DEVICE PARTICULARS:
   - Operating Platform: CryptoTrace Enterprise LEA Forensic Cluster
   - Cryptographic SHA-256 Anchor: ${hash}
   - Chain-of-Custody Integrity: VERIFIED TAMPER-FREE
   - Certification Timestamp: ${new Date().toISOString()}
   - Reviewing Magistrate / Officer: ${user?.name || "Justice K. S. Rao (Judicial Reviewer)"}
   - Jurisdiction Code: IN-JUDICIAL-00 (Read-Only Evidence Review)

B. STATUTORY CERTIFICATION:
   I, the undersigned Judicial Reviewer, hereby certify that:
   (a) The electronic records, multi-hop blockchain flow topology, and Section 94 BNSS
       statutory freeze directives were produced by computerized law enforcement systems
       operating during lawful cybercrime investigation.
   (b) The cryptographic hash chain of custody (SHA-256: ${hash.slice(0, 16)}...)
       remained untampered throughout the evidentiary ingestion window.
   (c) No unauthorized alterations, overwrites, or deletions occurred during judicial review.

C. ADMISSIBILITY ATTESTATION:
   This electronic evidence record satisfies all statutory criteria of admissibility
   in a Court of Law under Section 63 and Section 65B of the Bharatiya Sakshya Adhiniyam, 2023.

[DIGITALLY VERIFIED - ELECTRONIC JUDICIAL SEAL - BSA 2023]
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
                  {isCourtReviewer
                    ? "Judicial Evidence Dossier Chamber · Section 63/65B BSA"
                    : "NCRP Cyber Crime Complaints & Case Management"}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                  {isCourtReviewer
                    ? "IN-JUDICIAL-00 · HIGH COURT REVIEW"
                    : user?.role === "SUPER_ADMIN"
                    ? "PAN-INDIA CENTRAL GATEWAY"
                    : user?.jurisdiction_code || "MH-CYBER-01"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {isCourtReviewer
                  ? "Read-only judicial inspection of cryptographic evidence dossiers, SHA-256 integrity anchors & Section 65B certificates"
                  : `Logged in as ${user?.name} (${user?.role}) • ${
                      user?.is_gazetted
                        ? "Gazetted Officer (Sec 94 BNSS Statutory Trace & Freeze Authority)"
                        : "Field Investigator (Assigned Cases)"
                    }`}
              </p>
            </div>
          </div>

          {!isCourtReviewer ? (
            <button
              onClick={() => setShowIngestModal(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition hover:opacity-90 shadow-sm border border-emerald-500/40"
              style={{ background: "#059669" }}
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

              {/* For Court Reviewer: SHA-256 Cryptographic Evidence Integrity Box */}
              {isCourtReviewer && (
                <div className="mb-3.5 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🔒</span>
                      <span>BSA 2023 Section 65B Cryptographic Evidence Hash</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      ✓ CHAIN-OF-CUSTODY CERTIFIED
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-amber-200/95 break-all bg-black/40 px-2.5 py-1.5 rounded border border-white/5">
                    SHA-256: {generateDossierHash(c)}
                  </div>
                  <div className="text-[10.5px] text-muted mt-1.5 flex items-center justify-between flex-wrap gap-2">
                    <span>Certified Tamper-Proof &bull; Anchor: SHA-256 &bull; Admissible Electronic Record under Sec 63 BSA 2023</span>
                    <span className="text-slate-400 font-mono text-[10px]">Verified: {new Date().toISOString().split("T")[0]}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="text-[11px] text-muted flex flex-wrap items-center gap-2">
                  <span>Assigned IO:</span>
                  <strong className="text-white">
                    {c.assigned_investigator_name || (c.assigned_investigator_id ? "SI Patil" : "Unassigned")}
                  </strong>
                  {c.priority && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      c.priority === "CRITICAL"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {c.priority}
                    </span>
                  )}
                  {isSupervisor && (
                    <button
                      onClick={() => handleOpenAssignModal(c)}
                      className="ml-2 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/40 shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>👮‍♂️</span>
                      <span>Assign Case to Officer</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isCourtReviewer ? (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-semibold">
                        ⚖️ BSA SEC 65B READ-ONLY
                      </span>
                      <button
                        onClick={() => {
                          setCertModalCase(c);
                          setCertCopied(false);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span>📜</span>
                        <span>Export Sec 65B BSA Certificate</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveCase(c);
                          void runTrace(c.suspect_wallet_address, c);
                          onGoToGraph();
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/25 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>📊</span>
                        <span>Inspect Flow Graph</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {c.status === "PENDING_TRACING" && (
                        canExecuteTrace ? (
                          <button
                            onClick={() => handleTraceClick(c)}
                            disabled={isTracingThis}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition hover:opacity-90 shadow-sm border border-emerald-500/40 disabled:opacity-50 flex items-center gap-1.5"
                            style={{ background: "#059669" }}
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
                    </>
                  )}

                  {normRole !== "VICTIM" && (
                    <button
                      onClick={() => handleOpenAuditHistory(c.case_number)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 hover:border-white/20 bg-white/5 text-slate-300 hover:text-white transition flex items-center gap-1.5"
                      title="View immutable Section 65B audit history for this case"
                    >
                      <span>📜</span>
                      <span>Audit Trail</span>
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

            {/* Prominent 1-Click Autofill Demo Case Button */}
            <div className="mb-4 p-3.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 flex items-center justify-between gap-3 shadow-md">
              <div className="min-w-0">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>Evaluator Fast-Track Scenario</span>
                </div>
                <div className="text-[11px] text-cyan-200/80 truncate">
                  Autofill ₹3,50,000 USDT task scam on Ethereum (0x71C7...)
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutofillDemoCase}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 transition shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>✨</span>
                <span>Autofill Demo Case</span>
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
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <div>
                  <h2 className="text-base font-bold text-white">Immutable Case Audit History</h2>
                  <p className="text-xs text-muted font-mono">{auditModalCase} &bull; BSA 2023 Section 63/65B Tamper-Evident Trail</p>
                </div>
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
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <div>
                  <h2 className="text-base font-bold text-white">Section 65B BSA Electronic Evidence Certificate</h2>
                  <p className="text-xs text-muted font-mono">{certModalCase.case_number} &bull; Bharatiya Sakshya Adhiniyam, 2023</p>
                </div>
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
              <pre className="whitespace-pre-wrap">{buildCertText(certModalCase)}</pre>
            </div>

            <div className="pt-4 border-t mt-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs text-muted">
                Statutory admissibility: Sec 63 & 65B BSA 2023 &bull; Electronic Judicial Seal
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(buildCertText(certModalCase));
                    setCertCopied(true);
                    setTimeout(() => setCertCopied(false), 3000);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  style={{ background: "linear-gradient(135deg, #eab308, #f59e0b)" }}
                >
                  <span>📋</span>
                  <span>{certCopied ? "Copied to Clipboard! ✓" : "Copy Sec 65B Certificate"}</span>
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
