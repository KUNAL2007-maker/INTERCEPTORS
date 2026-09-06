"use client";

import { useState } from "react";
import { Page, Card } from "../ui/Page";
import { useAuth } from "../AuthProvider";

export function ExchangePortalView() {
  const { user } = useAuth();
  const [freezeConfirmed, setFreezeConfirmed] = useState(false);
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [freezeTicket, setFreezeTicket] = useState("BIN-ESCROW-2026-9042");

  const handleConfirmFreeze = async () => {
    setFreezeConfirmed(true);
    try {
      await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Acknowledged",
          action: "acknowledge",
          target_vasp: "Binance International",
          vasp_id: 1,
          case_number: "MH-CYBER-2026-0842",
          notice: {
            ref: "BNSS-2026-0842-BN",
            to_vasp: "Binance International",
            serviceable: true
          }
        })
      });
    } catch {
      // Offline fallback
    }
  };

  const handleUploadKyc = () => {
    setKycSubmitted(true);
  };

  return (
    <Page width="wide">
      {/* VASP Header Banner */}
      <div
        className="rounded-2xl border p-5 mb-6 shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(249, 115, 22, 0.04))",
          borderColor: "rgba(234, 179, 8, 0.3)"
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
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
                Officer: <strong className="text-white">{user?.name || "Binance Compliance Lead"}</strong> &bull; FIU-IND Registered Reporting Entity &bull; Strict VASP Data Boundary
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              ● Statutory Inbound Portal Live
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Inbound Requisitions</div>
          <div className="text-2xl font-bold text-white">1 Active Notice</div>
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

      {/* Inbound Requisition Card */}
      <div className="space-y-6">
        <Card
          title="Active Law Enforcement Statutory Requisition"
          hint="Issued under Section 94 Bharatiya Nagarik Suraksha Sanhita, 2023 (Mandatory Compliance)"
        >
          <div
            className="p-4 rounded-xl border mb-4"
            style={{
              background: "var(--surface-sunken)",
              borderColor: "var(--border)"
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3" style={{ borderColor: "var(--border)" }}>
              <div>
                <span className="text-xs font-mono font-bold text-white">REQUISITION REF: BNSS-2026-0842-BN</span>
                <span className="text-[11px] text-muted block mt-0.5">Originating FIR: CR-842/2026 &bull; Maharashtra Cyber Cell BKC</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  freezeConfirmed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                }`}
              >
                {freezeConfirmed ? "COMPLIANCE CONFIRMED (FROZEN)" : "IMMEDIATE ACTION REQUIRED"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <span className="text-muted block text-[10px] uppercase font-semibold">Flagged Suspect Deposit Wallet</span>
                <code className="text-cyan-300 font-mono break-all text-[11px]">
                  0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                </code>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase font-semibold">Tainted Deposit Volume</span>
                <span className="font-bold text-white text-sm">₹4,50,000 INR (approx 5,400 USDT)</span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase font-semibold">Investigating Officer</span>
                <span className="text-white">Officer Sharma (ACP, Gazetted Officer)</span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase font-semibold">Statutory Legal Directive</span>
                <span className="text-amber-300">Immediate Freeze of Inflow, Outflow, and P2P Trading Permissions</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              {!freezeConfirmed ? (
                <button
                  onClick={handleConfirmFreeze}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
                >
                  ✓ Confirm Asset Freeze under Sec 94(1) BNSS
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <span>🔒</span>
                  <span>Assets Locked in Escrow &bull; Ticket ID: {freezeTicket}</span>
                </div>
              )}

              {!kycSubmitted ? (
                <button
                  onClick={handleUploadKyc}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition border hover:bg-white/5"
                  style={{ borderColor: "var(--border)" }}
                >
                  📤 Upload User KYC & Login IP Disclosure (Sec 94(2) BNSS)
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                  <span>📄</span>
                  <span>KYC Dossier Transmitted to IO (Aadhaar & IP 103.21.x.x)</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
