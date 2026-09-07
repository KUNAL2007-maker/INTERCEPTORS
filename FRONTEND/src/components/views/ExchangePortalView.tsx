"use client";

import { useState, useEffect } from "react";
import { Page, Card } from "../ui/Page";
import { useAuth } from "../AuthProvider";
import { formatINR, shortWallet } from "@/lib/domain";

export function ExchangePortalView() {
  const { user } = useAuth();
  const [noticesList, setNoticesList] = useState<any[]>([]);
  const [confirmedNotices, setConfirmedNotices] = useState<Record<string, boolean>>({});
  const [kycSubmitted, setKycSubmitted] = useState<Record<string, boolean>>({});
  const [accountUids, setAccountUids] = useState<Record<string, string>>({});
  const [escrowRefs, setEscrowRefs] = useState<Record<string, string>>({});
  const [activeReportModal, setActiveReportModal] = useState<any | null>(null);
  const [reportCopied, setReportCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notices");
      if (res.ok) {
        const data = await res.json();
        if (data?.notices) {
          setNoticesList(data.notices);
          const initialConfirmed: Record<string, boolean> = {};
          const initialUids: Record<string, string> = {};
          const initialEscrows: Record<string, string> = {};

          data.notices.forEach((n: any) => {
            if (n.status === "Acknowledged") {
              initialConfirmed[n.id] = true;
            }
            initialUids[n.id] = n.account_uid || n.notice?.account_uid || "UID-849201948";
            initialEscrows[n.id] = n.escrow_ref || n.notice?.escrow_ref_id || `ESCROW-BIN-2026-${n.id?.slice(-4) || "98124"}`;
          });
          setConfirmedNotices(initialConfirmed);
          setAccountUids((prev) => ({ ...initialUids, ...prev }));
          setEscrowRefs((prev) => ({ ...initialEscrows, ...prev }));
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotices();
  }, []);

  const handleConfirmFreeze = async (noticeId: string, caseNumber?: string) => {
    const uid = accountUids[noticeId] || "UID-849201948";
    const escrowRef = escrowRefs[noticeId] || `ESCROW-BIN-2026-${noticeId.slice(-4) || "98124"}`;

    setConfirmedNotices((prev) => ({ ...prev, [noticeId]: true }));
    try {
      await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: noticeId,
          status: "Acknowledged",
          action: "acknowledge",
          target_vasp: "Binance International",
          vasp_id: 1,
          case_number: caseNumber || "CRIME-165445",
          account_uid: uid,
          escrow_ref_id: escrowRef,
          escrow_ref: escrowRef,
          notice: {
            ref: `BNSS-2026-${(caseNumber || "165445").slice(-6)}-BN`,
            to_vasp: "Binance International",
            serviceable: true,
            account_uid: uid,
            escrow_ref_id: escrowRef,
          },
        }),
      });
      await fetchNotices();
    } catch {
      // Offline fallback
    }
  };

  const handleUploadKyc = (noticeId: string) => {
    setKycSubmitted((prev) => ({ ...prev, [noticeId]: true }));
  };

  const buildComplianceReportText = (item: any) => {
    const ref = item.notice?.ref || `BNSS-2026-${(item.case_number || "165445").slice(-6)}-BN`;
    const cNumber = item.case_number || "CRIME-165445";
    const wallet = item.notice?.targetAddresses?.[0] || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    const uid = accountUids[item.id] || item.account_uid || "UID-849201948";
    const escrowRef = escrowRefs[item.id] || item.escrow_ref || `ESCROW-BIN-2026-98124`;
    const amountInr = item.notice?.amountInr || 350000;

    return `================================================================================
SECTION 94(1) BNSS STATUTORY COMPLIANCE ACKNOWLEDGMENT REPORT
BINANCE INTERNATIONAL NODAL COMPLIANCE DESK · FIU-IND LERS GATEWAY
================================================================================
Requisition Directive Reference : ${ref}
State Cyber Case Number        : ${cNumber}
Investigating Law Enforcement  : Maharashtra State Cyber Police HQ, Mumbai
Issuing Gazetted Officer       : ACP Sharma (Gazetted - Group A)
Class-3 DSC Token Serial       : MH-POL-DSC-2026-8849-ACPS
Statutory Mandate              : Sec 94(1) Bharatiya Nagarik Suraksha Sanhita, 2023

TARGET ACCOUNT & ESCROW LOCK SPECIFICATIONS:
--------------------------------------------------------------------------------
Attributed Suspect Wallet      : ${wallet}
Internal Binance Account UID   : ${uid}
VASP Custodial Escrow Lock ID  : ${escrowRef}
Custodial Escrow Vault         : BIN-ESCROW-VAULT-IN-09 (High-Security Cold Quarantine)
Quarantined Asset Balance      : ${amountInr} INR Equivalent (USDT on Ethereum)
Action Enacted                 : Full Account Freezing (Inflow/Outflow/P2P/Withdrawals Halted)

STATUTORY CERTIFICATION:
This formal report serves as legal acknowledgment under Section 94(1) BNSS, 2023
confirming that all digital asset operations associated with the targeted UID
have been placed under immutable custodial escrow pending judicial adjudication.

Compliance Officer             : ${user?.name || "Binance Compliance Lead"}
Reporting Entity               : Binance Services Holdings / FIU-IND Registered
Generated Timestamp            : ${new Date().toISOString()}
Compliance Status              : 100% COMPLIANT (ASSETS FROZEN IN ESCROW)
================================================================================`;
  };

  const downloadReportTxt = (item: any) => {
    const text = buildComplianceReportText(item);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VASP_BNSS94_COMPLIANCE_${item.case_number || item.id || "ESCROW"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Page width="wide">
      {/* VASP Header Banner */}
      <div
        className="rounded-2xl border p-5 mb-6 shadow-md"
        style={{
          background: "linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(249, 115, 22, 0.04))",
          borderColor: "rgba(234, 179, 8, 0.3)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm"
              style={{ background: "#f59e0b", color: "#000" }}
            >
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Exchange Nodal Compliance Portal · Section 94 BNSS
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                  BINANCE INTERNATIONAL NODAL DESK
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Officer: <strong className="text-white">{user?.name || "Binance Compliance Lead"}</strong> · FIU-IND Registered Reporting Entity · Strict VASP Data Boundary
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
              ● Statutory Inbound Portal Live
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Inbound Requisitions</div>
          <div className="text-2xl font-bold text-white">
            {noticesList.length} Active Notice{noticesList.length === 1 ? "" : "s"}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">Sec 94 BNSS / 91 CrPC</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Target Crypto Asset</div>
          <div className="text-2xl font-bold text-cyan-400">12,400 USDT</div>
          <div className="text-[11px] text-muted mt-1">Laundered Stolen Proceeds</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Statutory Response SLA</div>
          <div className="text-2xl font-bold text-emerald-400">&lt; 45 Mins</div>
          <div className="text-[11px] text-muted mt-1">Golden Window Requirement</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Issuing Authority</div>
          <div className="text-sm font-bold text-white mt-1">ACP Sharma (Gazetted)</div>
          <div className="text-[11px] text-muted mt-0.5">Maharashtra Cyber Crime Police</div>
        </Card>
      </div>

      {/* Inbound Requisitions */}
      <div className="space-y-6">
        <Card
          title="Active Law Enforcement Statutory Requisitions"
          hint="Issued under Section 94 Bharatiya Nagarik Suraksha Sanhita, 2023 (Mandatory Compliance)"
        >
          {noticesList.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              <div className="text-3xl mb-2">🏛️</div>
              <div className="font-semibold text-white">No Inbound Requisitions Awaiting Compliance</div>
              <p className="mt-1 max-w-md mx-auto text-[11px]">
                Statutory Section 94 BNSS freezing directives served by authorized Gazetted Police Officers (ACP Sharma) will appear here for internal UID attribution and custodial escrow lock.
              </p>
            </div>
          ) : (
            noticesList.map((item: any) => {
            const isConfirmed = confirmedNotices[item.id] || item.status === "Acknowledged";
            const isKycSent = kycSubmitted[item.id];
            const ref = item.notice?.ref || `BNSS-2026-${(item.case_number || "165445").slice(-6)}-BN`;
            const wallet = item.notice?.targetAddresses?.[0] || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
            const amountInr = item.notice?.amountInr || 350000;
            const currentUid = accountUids[item.id] || item.account_uid || "UID-849201948";
            const currentEscrow = escrowRefs[item.id] || item.escrow_ref || `ESCROW-BIN-2026-98124`;

            return (
              <div
                key={item.id}
                className="p-5 rounded-xl border mb-5 last:mb-0"
                style={{
                  background: "var(--surface-sunken)",
                  borderColor: isConfirmed ? "rgba(16, 185, 129, 0.3)" : "rgba(234, 179, 8, 0.3)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <span className="text-xs font-mono font-bold text-white">REQUISITION REF: {ref}</span>
                    <span className="text-[11px] text-muted block mt-0.5">
                      Originating LEA Case: <strong className="text-white">{item.case_number || "CRIME-165445"}</strong> · Maharashtra Cyber Police HQ (BKC)
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold ${
                      isConfirmed
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                    }`}
                  >
                    {isConfirmed ? "COMPLIANCE CONFIRMED (ASSETS IN ESCROW)" : "ACTION REQUIRED · MANDATORY FREEZE"}
                  </span>
                </div>

                {/* Gazetted Officer Class-3 DSC Seal Inspection Block */}
                <div
                  className="rounded-xl border p-3.5 mb-4 text-xs font-mono"
                  style={{ background: "#0a101d", borderColor: "rgba(16, 185, 129, 0.3)" }}
                >
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔏</span>
                      <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                        Gazetted Officer Class-3 DSC Seal Verified
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      ✓ CCA / NIC-CA VALID
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Issuing Gazetted Signer:</span>
                      <strong className="text-white">{item.drafted_by_name || item.approved_by_name || "ACP Sharma"} (Gazetted Officer - Group A)</strong>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Cryptographic Token ID:</span>
                      <span className="text-cyan-300">MH-POL-DSC-2026-8849-ACPS</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">Statutory Directive:</span>
                      <span className="text-amber-300">Sec 94 Bharatiya Nagarik Suraksha Sanhita, 2023</span>
                    </div>
                    <div>
                      <span className="text-muted text-[10px] uppercase block">SHA-256 Digest:</span>
                      <span className="text-emerald-300 break-all text-[10.5px]">
                        {item.notice?.dsc_hash ? item.notice.dsc_hash.slice(0, 20) + "..." : "88a91f342e01..."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Case & Wallet Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
                  <div>
                    <span className="text-muted block text-[10px] uppercase font-semibold">Flagged Suspect Deposit Address</span>
                    <code className="text-cyan-300 font-mono break-all text-[11.5px] bg-black/30 p-1.5 rounded block mt-1 border border-white/5">
                      {wallet}
                    </code>
                  </div>

                  <div>
                    <span className="text-muted block text-[10px] uppercase font-semibold">Tainted Deposit Volume</span>
                    <div className="text-white font-bold text-base mt-1">
                      {formatINR(amountInr ?? 0)}
                    </div>
                    <span className="text-[10px] text-muted">Equivalent USDT on Ethereum</span>
                  </div>

                  <div>
                    <span className="text-muted block text-[10px] uppercase font-semibold">Statutory SLA Window</span>
                    <span className="text-amber-300 font-medium block mt-1">
                      45 Minutes (Mandatory Asset Preservation)
                    </span>
                    <span className="text-[10px] text-muted">P2P, Spot & Futures Trading Quarantine</span>
                  </div>
                </div>

                {/* Real-World VASP Compliance Workflow Input Fields */}
                {!isConfirmed ? (
                  <div
                    className="p-3.5 rounded-xl border mb-4 text-xs space-y-3"
                    style={{ background: "#060a12", borderColor: "rgba(255, 255, 255, 0.08)" }}
                  >
                    <div className="text-[11px] uppercase tracking-wider text-muted font-bold flex items-center gap-1.5">
                      <span>⚙️</span>
                      <span>Binance Internal Compliance & Escrow Allocation</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-muted mb-1">
                          Internal Binance Account UID
                        </label>
                        <input
                          type="text"
                          value={currentUid}
                          onChange={(e) =>
                            setAccountUids((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="e.g. UID-849201948"
                          className="w-full px-3 py-2 rounded-lg text-xs font-mono text-white bg-white/[0.04] border border-white/15 focus:outline-none focus:border-amber-500/60"
                        />
                        <span className="text-[10px] text-muted mt-0.5 block">
                          Attributed Binance customer identification UID
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-semibold text-muted mb-1">
                          Freeze Reference / Escrow Transaction ID
                        </label>
                        <input
                          type="text"
                          value={currentEscrow}
                          onChange={(e) =>
                            setEscrowRefs((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="e.g. ESCROW-BIN-2026-98124"
                          className="w-full px-3 py-2 rounded-lg text-xs font-mono text-white bg-white/[0.04] border border-white/15 focus:outline-none focus:border-amber-500/60"
                        />
                        <span className="text-[10px] text-muted mt-0.5 block">
                          Custodial quarantine sub-account reference
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Confirmed Escrow Summary */
                  <div
                    className="p-3.5 rounded-xl border mb-4 text-xs flex flex-wrap items-center justify-between gap-3"
                    style={{ background: "rgba(16, 185, 129, 0.06)", borderColor: "rgba(16, 185, 129, 0.25)" }}
                  >
                    <div className="space-y-1 font-mono text-xs">
                      <div>
                        <span className="text-muted text-[10px] uppercase">Internal Account UID: </span>
                        <strong className="text-white">{currentUid}</strong>
                      </div>
                      <div>
                        <span className="text-muted text-[10px] uppercase">Escrow Reference ID: </span>
                        <strong className="text-emerald-300">{currentEscrow}</strong>
                      </div>
                      <div>
                        <span className="text-muted text-[10px] uppercase">Quarantine Vault: </span>
                        <span className="text-slate-300">BIN-ESCROW-VAULT-IN-09</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveReportModal(item)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>📜</span>
                      <span>View Sec 94(1) BNSS Compliance Report</span>
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  {!isConfirmed ? (
                    <button
                      onClick={() => handleConfirmFreeze(item.id, item.case_number)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition hover:opacity-90 shadow-sm border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer"
                      style={{ background: "#059669" }}
                    >
                      <span>🔒</span>
                      <span>Confirm Wallet Freeze & Escrow Lock</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                      <span>🔒</span>
                      <span>Assets Locked in Escrow · Reference: {currentEscrow}</span>
                    </div>
                  )}

                  {!isKycSent ? (
                    <button
                      onClick={() => handleUploadKyc(item.id)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition border hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span>📤</span>
                      <span>Upload User KYC & Login IP Disclosure (Sec 94(2) BNSS)</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                      <span>📄</span>
                      <span>KYC Dossier Transmitted to IO (Aadhaar & IP 103.21.x.x)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }))}
        </Card>
      </div>

      {/* Sec 94(1) BNSS Compliance Acknowledgment Report Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
            style={{ background: "#0a0f1d", borderColor: "rgba(16, 185, 129, 0.4)" }}
          >
            <button
              onClick={() => setActiveReportModal(null)}
              className="absolute right-4 top-4 text-muted hover:text-white text-base cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 grid place-items-center text-xl">
                📜
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Section 94(1) BNSS Compliance Acknowledgment Report
                </h3>
                <p className="text-xs text-muted font-mono">
                  Binance International LERS Gateway &bull; Official Statutory Return
                </p>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 rounded-xl border font-mono text-[11px] leading-relaxed max-h-[460px]"
              style={{ background: "#060a12", borderColor: "var(--border)", color: "#cbd5e1" }}
            >
              <pre className="whitespace-pre-wrap">{buildComplianceReportText(activeReportModal)}</pre>
            </div>

            <div className="pt-4 border-t mt-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs text-muted">
                Official Compliance Receipt &bull; FIU-IND Reporting Registered
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(buildComplianceReportText(activeReportModal));
                    setReportCopied(true);
                    setTimeout(() => setReportCopied(false), 3000);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  <span>📋</span>
                  <span>{reportCopied ? "Copied! ✓" : "Copy Acknowledgment"}</span>
                </button>
                <button
                  onClick={() => downloadReportTxt(activeReportModal)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-white/20 hover:bg-white/10 text-white transition cursor-pointer"
                >
                  Download .txt ↓
                </button>
                <button
                  onClick={() => setActiveReportModal(null)}
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
