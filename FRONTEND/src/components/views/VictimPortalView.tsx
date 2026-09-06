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

export function VictimPortalView() {
  const { user } = useAuth();
  const { cases, loadCases, ingestNcrpComplaint } = useTraceStore();

  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string | null>(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Registration Form State
  const [suspectWallet, setSuspectWallet] = useState("");
  const [lossAmount, setLossAmount] = useState("350000");
  const [tokenSymbol, setTokenSymbol] = useState("USDT");
  const [network, setNetwork] = useState("Ethereum");
  const [scamPlatform, setScamPlatform] = useState("Task-based Fake Part-Time Job Scam");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [txHash, setTxHash] = useState("");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [filing, setFiling] = useState(false);
  const [filedSuccessCase, setFiledSuccessCase] = useState<StoredCase | null>(null);

  // Load victim's cases on mount and auth change
  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  // Detected chain for suspect wallet input
  const detectedChain = useMemo(() => {
    return suspectWallet.trim() ? detectChain(suspectWallet.trim()) : null;
  }, [suspectWallet]);

  // Selected complaint object (defaults to first case)
  const activeComplaint: StoredCase | null = useMemo(() => {
    if (selectedCaseNumber) {
      return cases.find((c) => c.case_number === selectedCaseNumber) ?? cases[0] ?? null;
    }
    return cases[0] ?? null;
  }, [cases, selectedCaseNumber]);

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectWallet.trim()) return;
    setFiling(true);

    try {
      const complaintId = `NCRP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newCase = await ingestNcrpComplaint({
        complaint_id: complaintId,
        portal: "NCRP_1930_CFCFRMS",
        victim_name: user?.name || "Rajesh Verma",
        victim_email: user?.email || "victim.verma@gmail.com",
        victim_phone: "+91-98765-43210",
        suspect_wallet: suspectWallet.trim(),
        crime_category: scamPlatform,
        loss_amount_inr: Number(lossAmount),
        token_symbol: tokenSymbol,
        blockchain_network: network,
        incident_date: incidentDate,
        tx_hash: txHash.trim() || undefined,
        incident_description: incidentDesc.trim() || undefined,
      });

      await loadCases();

      if (newCase) {
        setFiledSuccessCase(newCase);
        setSelectedCaseNumber(newCase.case_number);
      } else {
        setSelectedCaseNumber(complaintId);
      }

      setShowFileModal(false);
      setSuspectWallet("");
      setTxHash("");
      setIncidentDesc("");
    } catch {
      // Offline fallback
    } finally {
      setFiling(false);
    }
  };

  const activeChain = activeComplaint ? detectChain(activeComplaint.suspect_wallet_address) : null;

  return (
    <Page width="wide">
      {/* Citizen Complainant Top Banner */}
      <div
        className="rounded-2xl border p-5 mb-6 shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.04))",
          borderColor: "rgba(6, 182, 212, 0.3)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-md"
              style={{ background: "#06b6d4", color: "#000" }}
            >
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Citizen Cyber Fraud Victim Portal &bull; NCRP 1930 Gateway
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                  PRIVACY-ISOLATED CITIZEN DESK
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Logged in as <strong className="text-white">{user?.name || "Rajesh Verma"}</strong> &bull;{" "}
                <span>{user?.email || "victim.verma@gmail.com"}</span> &bull; Mobile: +91 98765 43210
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFileModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
          >
            <span>+</span>
            <span>Register New Fraud Complaint</span>
          </button>
        </div>
      </div>

      {/* Success Alert on New Ingestion */}
      {filedSuccessCase && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="text-base">✅</span>
            <div>
              <strong className="block text-white font-semibold">
                Complaint Registered Successfully! Acknowledgment ID: {filedSuccessCase.case_number}
              </strong>
              <span>
                Your complaint has been ingested into the Maharashtra Cyber Unit NCRP gateway. Suspect wallet{" "}
                <code className="font-mono text-cyan-200">{shortWallet(filedSuccessCase.suspect_wallet_address)}</code> has
                been queued for multi-hop blockchain tracing by Investigating Officers.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-semibold transition"
            >
              View Receipt
            </button>
            <button
              onClick={() => setFiledSuccessCase(null)}
              className="text-muted hover:text-white text-sm px-1.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* My Filed Complaints Tabs */}
      {cases.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-wider text-muted font-bold mb-2 flex items-center justify-between">
            <span>My Registered Fraud Complaints ({cases.length})</span>
            <span className="text-[10px] text-muted lowercase">Click any complaint to track live recovery status</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {cases.map((c) => {
              const active = c.case_number === (activeComplaint?.case_number ?? "");
              const chainItem = detectChain(c.suspect_wallet_address);
              return (
                <button
                  key={c.case_number}
                  onClick={() => setSelectedCaseNumber(c.case_number)}
                  className={`text-left rounded-xl p-3 border transition min-w-[240px] shrink-0 ${
                    active
                      ? "bg-cyan-500/10 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30"
                      : "border-white/10 hover:border-white/20 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-white truncate">{c.case_number}</span>
                    <VictimStatusBadge status={c.status} />
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 truncate mb-1">
                    {shortWallet(c.suspect_wallet_address)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="font-bold text-slate-200">{formatINR(Number(c.loss_amount_inr))}</span>
                    <span>{chainItem ? CHAINS[chainItem].short : "ETH"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Key Metrics for Active Complaint */}
      {activeComplaint ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Reported Fraud Loss</div>
              <div className="text-2xl font-bold text-rose-400 font-mono">
                {formatINR(Number(activeComplaint.loss_amount_inr))}
              </div>
              <div className="text-[11px] text-muted mt-1">
                ~{Math.round(Number(activeComplaint.loss_amount_inr) / 85).toLocaleString()}{" "}
                {activeComplaint.token_symbol || "USDT"}
              </div>
            </Card>

            <Card>
              <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Investigation Phase</div>
              <div className="text-2xl font-bold text-cyan-400">
                {getPhaseName(activeComplaint.status).phase}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {getPhaseName(activeComplaint.status).subtext}
              </div>
            </Card>

            <Card>
              <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Identified Destination VASP</div>
              <div className="text-2xl font-bold text-white truncate">
                {activeComplaint.target_vasp || (activeComplaint.status === "PENDING_TRACING" ? "Attribution Pending" : "Binance Int.")}
              </div>
              <div className="text-[11px] text-cyan-400 mt-1">
                {activeComplaint.status === "FROZEN"
                  ? "✓ Locked in Escrow"
                  : activeComplaint.status === "NOTICE_SERVED"
                  ? "Sec 94 BNSS Served"
                  : "Exchange Deposit Identified"}
              </div>
            </Card>

            <Card>
              <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Assigned Cyber Unit</div>
              <div className="text-sm font-bold text-white mt-1">Maharashtra Cyber Unit</div>
              <div className="text-[11px] text-muted mt-0.5">
                IO: {activeComplaint.assigned_investigator_name || "ACP Sharma &bull; BKC Mumbai"}
              </div>
            </Card>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Dynamic Recovery Timeline */}
            <div className="lg:col-span-2 space-y-4">
              <Card
                title="Asset Recovery & Statutory Legal Tracking Timeline"
                hint="Real-time statutory progress under Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)"
              >
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 mt-2">
                  {/* Step 1: Ingestion */}
                  <TimelineStep
                    stepNum={1}
                    isDone={true}
                    isActive={false}
                    title="1. Fraud Incident Ingested via NCRP Gateway"
                    description={`Registered with Ack No. ${activeComplaint.case_number}. Suspect wallet recorded in police database.`}
                    timestamp={`${activeComplaint.incident_date || "17 Aug 2026"} &bull; Ingestion Confirmed`}
                  />

                  {/* Step 2: Police Assigned & Money Flow Mapped */}
                  <TimelineStep
                    stepNum={2}
                    isDone={activeComplaint.status !== "PENDING_TRACING"}
                    isActive={activeComplaint.status === "PENDING_TRACING"}
                    title="2. Automated Multi-Hop Blockchain Tracing"
                    description={
                      activeComplaint.status === "PENDING_TRACING"
                        ? "Assigned to Maharashtra Cyber Unit. Investigating Officer initiating forensic money flow tracing on suspect wallet."
                        : `Suspect wallet ${shortWallet(activeComplaint.suspect_wallet_address)} traced across hops. Laundering path unmasked.`
                    }
                    timestamp={activeComplaint.status === "PENDING_TRACING" ? "Under Police Investigation" : "Attribution Complete"}
                  />

                  {/* Step 3: VASP Attribution */}
                  <TimelineStep
                    stepNum={3}
                    isDone={activeComplaint.status === "TRACED" || activeComplaint.status === "NOTICE_SERVED" || activeComplaint.status === "FROZEN"}
                    isActive={activeComplaint.status === "PENDING_TRACING"}
                    title="3. Exchange / VASP Attribution Unmasked"
                    description={
                      activeComplaint.status === "PENDING_TRACING"
                        ? "Tracing algorithm actively locating deposit endpoints at FIU-IND registered crypto exchanges."
                        : `Laundered funds identified at ${activeComplaint.target_vasp || "Binance International"} deposit wallet.`
                    }
                    timestamp={
                      activeComplaint.status === "PENDING_TRACING" ? "Pending Trace Results" : "Attribution Verified"
                    }
                  />

                  {/* Step 4: Section 94 BNSS Freeze Notice */}
                  <TimelineStep
                    stepNum={4}
                    isDone={activeComplaint.status === "NOTICE_SERVED" || activeComplaint.status === "FROZEN"}
                    isActive={activeComplaint.status === "TRACED"}
                    title="4. Statutory Section 94 BNSS Freezing Order Served"
                    description={
                      activeComplaint.status === "NOTICE_SERVED" || activeComplaint.status === "FROZEN"
                        ? `Digitally signed by Gazetted Police Officer (ACP Sharma) under Section 94 BNSS / 91 CrPC and served directly to ${activeComplaint.target_vasp || "Binance"} Compliance.`
                        : activeComplaint.status === "TRACED"
                        ? "Money flow verified. Gazetted Police Officer preparing statutory Section 94 BNSS requisition."
                        : "Requires completion of money flow trace."
                    }
                    timestamp={
                      activeComplaint.status === "NOTICE_SERVED" || activeComplaint.status === "FROZEN"
                        ? "Statutory Notice Served"
                        : activeComplaint.status === "TRACED"
                        ? "Drafting Freezing Order"
                        : "Pending Prior Step"
                    }
                  />

                  {/* Step 5: Exchange Asset Freezing */}
                  <TimelineStep
                    stepNum={5}
                    isDone={activeComplaint.status === "FROZEN"}
                    isActive={activeComplaint.status === "NOTICE_SERVED"}
                    title="5. Exchange Asset Freezing & Escrow Confirmed"
                    description={
                      activeComplaint.status === "FROZEN"
                        ? `${activeComplaint.target_vasp || "Binance"} Nodal Officer confirmed asset lock. Cryptocurrency balance held safely in escrow under police directive.`
                        : activeComplaint.status === "NOTICE_SERVED"
                        ? `Exchange Compliance Nodal Desk processing freezing directive under 45-minute statutory SLA.`
                        : "Awaiting legal notice delivery to exchange compliance desk."
                    }
                    timestamp={
                      activeComplaint.status === "FROZEN"
                        ? "Assets Locked in Escrow"
                        : activeComplaint.status === "NOTICE_SERVED"
                        ? "Under Exchange Compliance Review"
                        : "Pending"
                    }
                  />

                  {/* Step 6: Judicial Restitution */}
                  <TimelineStep
                    stepNum={6}
                    isDone={false}
                    isActive={false}
                    title="6. Judicial Restitution & Fund Return to Bank Account"
                    description="Application under Section 503 BNSS (formerly Sec 451/457 CrPC) before Metropolitan Magistrate Court for judicial release of frozen cryptocurrency back to complainant."
                    timestamp="Pending Court Order"
                  />
                </div>
              </Card>
            </div>

            {/* Right 1 Col: Active Complaint Dossier & Actions */}
            <div className="space-y-4">
              <Card title="Active Complaint Dossier" hint="Official Cyber Crime Record">
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted block text-[10px] uppercase font-bold">Acknowledgment Number</span>
                    <span className="font-mono font-bold text-white text-sm">{activeComplaint.case_number}</span>
                  </div>

                  <div>
                    <span className="text-muted block text-[10px] uppercase font-bold">Suspect Wallet Address</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="text-xs break-all text-cyan-300 font-mono bg-black/40 px-2 py-1 rounded border border-white/5 flex-1">
                        {activeComplaint.suspect_wallet_address}
                      </code>
                    </div>
                    {activeChain && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold" style={{ background: `${chainColor(activeChain)}22`, color: chainColor(activeChain) }}>
                        {CHAINS[activeChain].name}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-muted block text-[10px] uppercase font-bold">Modus Operandi / Scam Type</span>
                    <span className="text-white font-medium">{activeComplaint.crime_type}</span>
                  </div>

                  {activeComplaint.tx_hashes && activeComplaint.tx_hashes.length > 0 && (
                    <div>
                      <span className="text-muted block text-[10px] uppercase font-bold">Transaction Hash</span>
                      <code className="text-[11px] break-all text-slate-300 font-mono">
                        {activeComplaint.tx_hashes[0]}
                      </code>
                    </div>
                  )}

                  <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={() => setShowReceiptModal(true)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold border hover:bg-white/5 transition flex items-center justify-center gap-2 text-cyan-300 border-cyan-500/30 bg-cyan-500/10"
                    >
                      <span>📄</span>
                      <span>Download Official NCRP Receipt</span>
                    </button>
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <span className="text-muted block text-[10px] uppercase font-bold mb-1">Police Support Contact</span>
                    <div className="text-white font-medium">Maharashtra Cyber Crime HQ</div>
                    <div className="text-muted text-[11px]">Bandra Kurla Complex (BKC), Mumbai</div>
                    <div className="text-cyan-400 text-[11px] mt-0.5 font-mono">Helpline: 1930 &bull; Ext: 441</div>
                  </div>
                </div>
              </Card>

              <Card title="Citizen Legal Rights" hint="Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)">
                <ul className="text-[11px] space-y-2 text-muted list-disc pl-4">
                  <li>
                    <strong className="text-white">Right to Freeze Requisition ID:</strong> Complainants are entitled to the Section 94 BNSS statutory reference code served to exchanges.
                  </li>
                  <li>
                    <strong className="text-white">1930 Golden Window:</strong> Quick reporting allows law enforcement to issue immediate asset preservation notices before off-ramping.
                  </li>
                  <li>
                    <strong className="text-white">Free Forensic Service:</strong> No fees charged by state police cyber cells for blockchain trace attribution.
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border p-12 text-center" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🛡️</div>
          <h2 className="text-base font-bold text-white">No Complaints Registered Yet</h2>
          <p className="text-xs text-muted mt-1 max-w-md mx-auto">
            Have you been defrauded in a cryptocurrency investment scam or task fraud? Register your suspect crypto wallet directly with the state cyber police to initiate automated multi-hop tracing.
          </p>
          <button
            onClick={() => setShowFileModal(true)}
            className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold text-black transition shadow-glow"
            style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
          >
            + Register Fraud Complaint Now
          </button>
        </div>
      )}

      {/* File Complaint Modal */}
      {showFileModal && (
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
              onClick={() => setShowFileModal(false)}
              className="absolute right-4 top-4 text-muted hover:text-white text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛡️</span>
              <h2 className="text-base font-bold text-white">Register Fraudulent Crypto Wallet</h2>
            </div>
            <p className="text-xs text-muted mb-4">
              Directly forwards fraudster wallet to state cyber police attribution engine for Section 94 BNSS freezing.
            </p>

            <form onSubmit={handleFileComplaint} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">
                  Fraudster Suspect Wallet Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={suspectWallet}
                    onChange={(e) => setSuspectWallet(e.target.value)}
                    placeholder="0x... (ETH/Polygon) or T... (TRON) or bc1... (BTC)"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    style={{
                      background: "var(--surface-sunken)",
                      borderColor: "var(--border)",
                      color: "var(--text-strong)",
                    }}
                  />
                  {detectedChain && (
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold"
                      style={{
                        background: `${chainColor(detectedChain)}22`,
                        color: chainColor(detectedChain),
                      }}
                    >
                      {CHAINS[detectedChain].name}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted">Estimated Loss (INR) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={lossAmount}
                    onChange={(e) => setLossAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none font-mono"
                    style={{
                      background: "var(--surface-sunken)",
                      borderColor: "var(--border)",
                      color: "var(--text-strong)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted">Token / Currency</label>
                  <select
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                    style={{
                      background: "var(--surface-sunken)",
                      borderColor: "var(--border)",
                      color: "var(--text-strong)",
                    }}
                  >
                    <option value="USDT">USDT (Tether USD)</option>
                    <option value="ETH">ETH (Ethereum)</option>
                    <option value="BTC">BTC (Bitcoin)</option>
                    <option value="MATIC">MATIC (Polygon)</option>
                    <option value="TRX">TRX (TRON)</option>
                    <option value="INR">INR (Direct Fiat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted">Blockchain Network</label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                    style={{
                      background: "var(--surface-sunken)",
                      borderColor: "var(--border)",
                      color: "var(--text-strong)",
                    }}
                  >
                    <option value="Ethereum">Ethereum (ERC-20)</option>
                    <option value="TRON">TRON (TRC-20)</option>
                    <option value="Polygon">Polygon (MATIC)</option>
                    <option value="Bitcoin">Bitcoin (BTC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted">Date of Fraud Incident</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
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
                <label className="block text-xs font-semibold mb-1 text-muted">Scam Modus Operandi</label>
                <select
                  value={scamPlatform}
                  onChange={(e) => setScamPlatform(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    background: "var(--surface-sunken)",
                    borderColor: "var(--border)",
                    color: "var(--text-strong)",
                  }}
                >
                  <option value="Task-based Fake Part-Time Job Scam">Task-based Fake Part-Time Job / VIP Group Scam</option>
                  <option value="Fake Crypto Investment / Staking Platform">Fake Crypto Investment / Staking High-Return Scheme</option>
                  <option value="Phishing / Seed Phrase Theft">Phishing / Impersonation of Indian Exchange</option>
                  <option value="P2P Escrow Fraud">P2P Escrow / Payment Withholding Fraud</option>
                  <option value="Romance / Pig Butchering Scam">Romance / Social Engineering (Pig Butchering)</option>
                  <option value="Digital Arrest / Law Enforcement Impersonation">Digital Arrest / Fake Police Impersonation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">
                  Transaction Hash (Tx Hash / TxID) <span className="text-muted text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  placeholder="0x... (from your exchange or wallet withdrawal)"
                  className="w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none font-mono"
                  style={{
                    background: "var(--surface-sunken)",
                    borderColor: "var(--border)",
                    color: "var(--text-strong)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">
                  Brief Incident Narrative <span className="text-muted text-[10px]">(Optional)</span>
                </label>
                <textarea
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  rows={2}
                  placeholder="E.g., Contacted via Telegram channel for hotel review job, transferred USDT..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none resize-none"
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
                  disabled={filing}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-black transition disabled:opacity-50 shadow-glow"
                  style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
                >
                  {filing ? "Submitting to NCRP 1930..." : "Transmit Complaint to State Cyber Police"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Acknowledgment Receipt Modal */}
      {showReceiptModal && activeComplaint && (
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
              onClick={() => setShowReceiptModal(false)}
              className="absolute right-4 top-4 text-muted hover:text-white text-lg"
            >
              ✕
            </button>

            <div className="text-center pb-4 border-b border-white/10 mb-4">
              <div className="text-2xl mb-1">🇮🇳</div>
              <h2 className="text-sm font-bold text-white tracking-wide">NATIONAL CYBER CRIME REPORTING PORTAL</h2>
              <div className="text-[11px] text-cyan-300 font-semibold mt-0.5">
                Government of India &bull; Ministry of Home Affairs (I4C)
              </div>
              <div className="text-[10px] text-muted uppercase tracking-widest mt-1">
                Official Complaint Acknowledgment Receipt
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted">Acknowledgment Number:</span>
                <span className="font-mono font-bold text-cyan-300">{activeComplaint.case_number}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted">Complainant Name:</span>
                <span className="text-white font-semibold">{user?.name || "Rajesh Verma"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted">Complainant Contact:</span>
                <span className="text-white">+91 98765 43210 &bull; {user?.email || "victim.verma@gmail.com"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted">Reported Date:</span>
                <span className="text-white font-mono">{activeComplaint.incident_date || "2026-08-17"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted">Assigned Cyber PS:</span>
                <span className="text-white">Maharashtra Cyber Unit (BKC Mumbai)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted">Reported Loss Amount:</span>
                <span className="font-bold text-rose-400 font-mono">
                  {formatINR(Number(activeComplaint.loss_amount_inr))}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted">Suspect Wallet:</span>
                <span className="font-mono text-cyan-300 text-[11px]">{shortWallet(activeComplaint.suspect_wallet_address)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-muted">Statutory Status:</span>
                <span className="font-semibold text-emerald-300">{activeComplaint.status}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition text-center"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-black transition text-center"
                style={{ background: "#06b6d4" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

function VictimStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING_TRACING":
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
          Investigating
        </span>
      );
    case "TRACED":
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
          Traced
        </span>
      );
    case "NOTICE_SERVED":
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold">
          Notice Served
        </span>
      );
    case "FROZEN":
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
          Assets Frozen
        </span>
      );
    default:
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          {status}
        </span>
      );
  }
}

function getPhaseName(status: string): { phase: string; subtext: string } {
  switch (status) {
    case "PENDING_TRACING":
      return { phase: "Phase 1 / 6", subtext: "Ingested & Queued for Trace" };
    case "TRACED":
      return { phase: "Phase 3 / 6", subtext: "Money Flow Traced to Exchange" };
    case "NOTICE_SERVED":
      return { phase: "Phase 4 / 6", subtext: "Sec 94 BNSS Notice Served" };
    case "FROZEN":
      return { phase: "Phase 5 / 6", subtext: "✓ Assets Frozen in Escrow" };
    default:
      return { phase: "Phase 2 / 6", subtext: "Under Police Review" };
  }
}

function TimelineStep({
  stepNum,
  isDone,
  isActive,
  title,
  description,
  timestamp,
}: {
  stepNum: number;
  isDone: boolean;
  isActive: boolean;
  title: string;
  description: string;
  timestamp: string;
}) {
  return (
    <div className="relative">
      <span
        className={`absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-[#0d1117] ${
          isDone
            ? "bg-emerald-500 text-black"
            : isActive
            ? "bg-amber-400 text-black animate-pulse"
            : "bg-slate-700 text-slate-400"
        }`}
      >
        {isDone ? "✓" : isActive ? "●" : stepNum}
      </span>
      <div className={`text-xs font-bold ${isDone ? "text-white" : isActive ? "text-amber-300" : "text-slate-400"}`}>
        {title}
      </div>
      <div className="text-[11px] text-muted mt-0.5">{description}</div>
      <span
        className={`text-[10px] font-mono ${
          isDone ? "text-muted" : isActive ? "text-amber-400" : "text-slate-500"
        }`}
      >
        {timestamp}
      </span>
    </div>
  );
}
