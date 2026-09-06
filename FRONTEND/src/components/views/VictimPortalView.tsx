"use client";

import { useState } from "react";
import { Page, Card } from "../ui/Page";
import { useAuth } from "../AuthProvider";
import { useTraceStore } from "@/lib/store";

export function VictimPortalView() {
  const { user } = useAuth();
  const { ingestNcrpComplaint, runTrace } = useTraceStore();
  const [showFileModal, setShowFileModal] = useState(false);
  const [suspectWallet, setSuspectWallet] = useState("");
  const [lossAmount, setLossAmount] = useState("350000");
  const [network, setNetwork] = useState("Ethereum");
  const [scamPlatform, setScamPlatform] = useState("Telegram Crypto Staking VIP Group");
  const [filing, setFiling] = useState(false);
  const [filedSuccess, setFiledSuccess] = useState<string | null>(null);

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspectWallet) return;
    setFiling(true);
    try {
      const complaintId = `NCRP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      await ingestNcrpComplaint({
        complaint_id: complaintId,
        portal: "NCRP_1930_CFCFRMS",
        victim_phone: "+91-98765-43210",
        suspect_wallet: suspectWallet.trim(),
        crime_category: scamPlatform,
        loss_amount_inr: Number(lossAmount),
        blockchain_network: network
      });
      setFiledSuccess(complaintId);
      setShowFileModal(false);
      setSuspectWallet("");
    } catch {
      // Fallback
    } finally {
      setFiling(false);
    }
  };

  return (
    <Page width="wide">
      {/* Citizen Banner */}
      <div
        className="rounded-2xl border p-5 mb-6 shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.04))",
          borderColor: "rgba(6, 182, 212, 0.3)"
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ background: "#06b6d4", color: "#000" }}
            >
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Citizen Fraud Victim Portal · NCRP 1930
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                  PRIVACY-ISOLATED
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Logged in as <strong className="text-white">{user?.name || "Rajesh Verma"}</strong> &bull; Citizen Complainant &bull; Mobile: +91 98765 43210
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFileModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-black transition hover:opacity-90 shadow-glow"
            style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
          >
            + Report New Suspect Crypto Wallet
          </button>
        </div>
      </div>

      {filedSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>
              Complaint <strong>{filedSuccess}</strong> submitted successfully to NCRP gateway. Police cyber units alerted.
            </span>
          </div>
          <button
            onClick={() => setFiledSuccess(null)}
            className="text-muted hover:text-white text-sm ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Total Reported Loss</div>
          <div className="text-2xl font-bold text-red-400">₹4,50,000</div>
          <div className="text-[11px] text-muted mt-1">~5,400 USDT (Tether)</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Recovery Phase</div>
          <div className="text-2xl font-bold text-amber-400">Phase 4 / 6</div>
          <div className="text-[11px] text-emerald-400 mt-1">✓ Assets Traced & Freezing Order Active</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Identified Exchange</div>
          <div className="text-2xl font-bold text-white">Binance Int.</div>
          <div className="text-[11px] text-cyan-400 mt-1">Deposit Hot Wallet Identified</div>
        </Card>

        <Card>
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium mb-1">Assigned Police Station</div>
          <div className="text-sm font-bold text-white mt-1">Maharashtra Cyber Unit</div>
          <div className="text-[11px] text-muted mt-0.5">IO: ACP Sharma &bull; BKC Mumbai</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-time Recovery Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Asset Recovery & Legal Tracking Timeline" hint="Live progress under Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 mt-2">
              {/* Step 1 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-4 ring-[#0d1117]">
                  ✓
                </span>
                <div className="text-xs font-bold text-white">1. Fraud Incident Ingested via NCRP / 1930 Helpline</div>
                <div className="text-[11px] text-muted mt-0.5">
                  Complaint registered at Maharashtra Cyber Hub. Suspect wallet <code>0x71C7...76F</code> recorded.
                </div>
                <span className="text-[10px] text-muted font-mono">17 Aug 2026 &bull; 09:15 IST</span>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-4 ring-[#0d1117]">
                  ✓
                </span>
                <div className="text-xs font-bold text-white">2. Multi-Hop Blockchain Money Flow Mapped</div>
                <div className="text-[11px] text-muted mt-0.5">
                  Laundering path analyzed across 4 hops: Victim Entry &rarr; 3 Burner Mule Wallets &rarr; Peeling Chain &rarr; Tornado Cash obfuscation attempt.
                </div>
                <span className="text-[10px] text-muted font-mono">17 Aug 2026 &bull; 09:22 IST</span>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-4 ring-[#0d1117]">
                  ✓
                </span>
                <div className="text-xs font-bold text-white">3. Exchange / VASP Attribution Unmasked</div>
                <div className="text-[11px] text-muted mt-0.5">
                  Laundered funds landed in deposit wallets of <strong className="text-white">Binance International</strong> and <strong className="text-white">WazirX India</strong>.
                </div>
                <span className="text-[10px] text-muted font-mono">17 Aug 2026 &bull; 09:30 IST</span>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black ring-4 ring-[#0d1117]">
                  ✓
                </span>
                <div className="text-xs font-bold text-white">4. Statutory Section 94 BNSS Freeze Notice Issued</div>
                <div className="text-[11px] text-muted mt-0.5">
                  Digitally signed by <strong className="text-white">Officer Sharma (ACP, Gazetted)</strong> under Section 94 BNSS / 91 CrPC and served directly to Binance Compliance.
                </div>
                <span className="text-[10px] text-muted font-mono">17 Aug 2026 &bull; 10:15 IST</span>
              </div>

              {/* Step 5 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black ring-4 ring-[#0d1117] animate-pulse">
                  ●
                </span>
                <div className="text-xs font-bold text-amber-300">5. Exchange Asset Freezing & Holding Confirmed</div>
                <div className="text-[11px] text-muted mt-0.5">
                  Binance Nodal Officer acknowledged notice. Cryptocurrency balance held in escrow under police directive.
                </div>
                <span className="text-[10px] text-amber-400 font-mono">In Progress</span>
              </div>

              {/* Step 6 */}
              <div className="relative">
                <span className="absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold text-slate-400 ring-4 ring-[#0d1117]">
                  6
                </span>
                <div className="text-xs font-bold text-slate-400">6. Judicial Restitution & Fund Return to Bank Account</div>
                <div className="text-[11px] text-muted mt-0.5">
                  Application under Section 451/457 CrPC (Sec 503 BNSS) before Metropolitan Magistrate Court for release of frozen assets to complainant.
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Pending Court Hearing</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Case Dossier & Police Contact */}
        <div className="space-y-4">
          <Card title="Active Complaint Details" hint="Official Cyber Crime Record">
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted block text-[10px] uppercase font-bold">Acknowledgment Number</span>
                <span className="font-mono font-bold text-white text-sm">MH-CYBER-2026-0842</span>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase font-bold">Suspect Wallet Address</span>
                <code className="text-[11px] break-all text-cyan-300">
                  0x71C7656EC7ab88b098defB751B7401B5f6d8976F
                </code>
              </div>

              <div>
                <span className="text-muted block text-[10px] uppercase font-bold">Modus Operandi</span>
                <span className="text-white">Task-based Fake Part-Time Job Crypto Scam</span>
              </div>

              <div className="border-t pt-2" style={{ borderColor: "var(--border)" }}>
                <span className="text-muted block text-[10px] uppercase font-bold mb-1">Police Support Contact</span>
                <div className="text-white font-medium">Maharashtra Cyber Crime HQ</div>
                <div className="text-muted text-[11px]">Bandra Kurla Complex (BKC), Mumbai</div>
                <div className="text-cyan-400 text-[11px] mt-0.5 font-mono">Helpline: 1930 &bull; Ext: 441</div>
              </div>
            </div>
          </Card>

          <Card title="Victim Legal Rights" hint="Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)">
            <ul className="text-[11px] space-y-2 text-muted list-disc pl-4">
              <li>
                <strong className="text-white">Right to Freeze Notice Copy:</strong> Victims are entitled to the Section 94 BNSS requisition acknowledgment ID.
              </li>
              <li>
                <strong className="text-white">Immediate 1930 Golden Hour Rule:</strong> Fund recovery likelihood exceeds 80% when reported within 2 hours of transaction.
              </li>
              <li>
                <strong className="text-white">Court Restitution:</strong> No legal fees charged by government cyber cells for blockchain attribution.
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* File Complaint Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative"
            style={{
              background: "#0d1117",
              borderColor: "var(--border)",
              color: "var(--text-strong)"
            }}
          >
            <button
              onClick={() => setShowFileModal(false)}
              className="absolute right-4 top-4 text-muted hover:text-white text-lg"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-white mb-1">Report Suspect Cryptocurrency Wallet</h2>
            <p className="text-xs text-muted mb-4">
              Directly forwards fraud-linked crypto address to the state cyber police attribution engine.
            </p>

            <form onSubmit={handleFileComplaint} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">
                  Fraudster Wallet Address (Deposit Address)
                </label>
                <input
                  type="text"
                  value={suspectWallet}
                  onChange={(e) => setSuspectWallet(e.target.value)}
                  placeholder="0x... or T..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  style={{
                    background: "var(--surface-sunken)",
                    borderColor: "var(--border)",
                    color: "var(--text-strong)"
                  }}
                />
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
                      color: "var(--text-strong)"
                    }}
                  >
                    <option value="Ethereum">Ethereum (ERC-20)</option>
                    <option value="Polygon">Polygon (MATIC)</option>
                    <option value="TRON">TRON (TRC-20 USDT)</option>
                    <option value="Bitcoin">Bitcoin (BTC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted">Loss Amount (INR)</label>
                  <input
                    type="number"
                    value={lossAmount}
                    onChange={(e) => setLossAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                    style={{
                      background: "var(--surface-sunken)",
                      borderColor: "var(--border)",
                      color: "var(--text-strong)"
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-muted">Scam Platform / Channel Name</label>
                <input
                  type="text"
                  value={scamPlatform}
                  onChange={(e) => setScamPlatform(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    background: "var(--surface-sunken)",
                    borderColor: "var(--border)",
                    color: "var(--text-strong)"
                  }}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={filing}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-black transition disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
                >
                  {filing ? "Transmitting to NCRP..." : "Submit Report to Cyber Cell"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
}
