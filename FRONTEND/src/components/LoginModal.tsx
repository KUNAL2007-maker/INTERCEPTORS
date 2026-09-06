"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export type DemoAccount = {
  email: string;
  role: string;
  name: string;
  password: string;
  rank: string;
  jurisdiction: string;
  abacFeature: string;
  tagColor: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "investigator@example.demo",
    password: "Patil@123",
    role: "INVESTIGATING_OFFICER",
    name: "SI Patil",
    rank: "Investigating Officer (Primary User)",
    jurisdiction: "MH-CYBER-01",
    abacFeature: "Case-level access: Tracing, graph, wallet analysis, draft notices & AI copilot",
    tagColor: "#f59e0b"
  },
  {
    email: "supervisor@example.demo",
    password: "Deshmukh@123",
    role: "CYBERCRIME_SUPERVISOR",
    name: "SP Deshmukh",
    rank: "Cybercrime Unit Supervisor",
    jurisdiction: "MH-CYBER-01",
    abacFeature: "Unit triage: Assign & reassign IOs, change priority, review cases & audit trail",
    tagColor: "#8b5cf6"
  },
  {
    email: "senior@example.demo",
    password: "Police@123",
    role: "SENIOR_INVESTIGATOR",
    name: "ACP Sharma",
    rank: "Gazetted Senior Investigator (ACP)",
    jurisdiction: "MH-CYBER-01",
    abacFeature: "Statutory Authority: Digitally sign & issue Section 94 BNSS freeze orders",
    tagColor: "#10b981"
  },
  {
    email: "compliance@example.demo",
    password: "Compliance@123",
    role: "VASP_COMPLIANCE_OFFICER",
    name: "Example Crypto Exchange (Binance)",
    rank: "VASP Compliance Officer",
    jurisdiction: "External VASP Desk",
    abacFeature: "VASP Isolation: Access only orders directed to exchange; acknowledge & lock escrow",
    tagColor: "#eab308"
  },
  {
    email: "court@example.demo",
    password: "Judge@123",
    role: "COURT_REVIEWER",
    name: "Justice Rao (Court Reviewer)",
    rank: "Judicial / Evidentiary Reviewer",
    jurisdiction: "IN-JUDICIAL-00",
    abacFeature: "READ ONLY: Review evidence packages, verify SHA-256 hashes & inspect audit logs",
    tagColor: "#94a3b8"
  },
  {
    email: "national@example.demo",
    password: "National@123",
    role: "NATIONAL_COORDINATION_ANALYST",
    name: "National Analyst",
    rank: "National Coordination Analyst",
    jurisdiction: "IN-I4C-00 (Pan-India)",
    abacFeature: "Cross-Jurisdiction: Multi-state case indicators, wallet clusters & intelligence alerts",
    tagColor: "#38bdf8"
  },
  {
    email: "victim.verma@example.demo",
    password: "Victim@123",
    role: "VICTIM",
    name: "Rajesh Verma (Complainant)",
    rank: "Citizen / Victim",
    jurisdiction: "Public Portal",
    abacFeature: "Privacy Isolation: Submit fraud complaint, view own status & recovery milestones",
    tagColor: "#06b6d4"
  },
  {
    email: "admin@example.demo",
    password: "Admin@123",
    role: "SYSTEM_ADMIN",
    name: "System Administrator",
    rank: "Application Infrastructure Lead",
    jurisdiction: "IN-I4C-00",
    abacFeature: "Infrastructure: Manage users, system health, security logs & emergency lockdown",
    tagColor: "#f43f5e"
  }
];

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<"quick" | "manual">("quick");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }
    setLoading(true);
    setError(null);

    const err = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      onClose();
    }
  };

  const handleQuickLogin = async (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setLoading(true);
    setError(null);

    const err = await signIn(account.email, account.password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border p-6 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--text)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prototype Header Banner */}
        <div className="flex items-start justify-between pb-3 border-b mb-3" style={{ borderColor: "var(--border)" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 ring-1 ring-inset ring-amber-500/20">
                SIH 2026 PROTOTYPE
              </span>
              <span className="text-[10px] text-muted uppercase tracking-wider font-mono">Simulated LEA Environment</span>
            </div>
            <h2 className="text-lg font-bold mt-1" style={{ color: "var(--text-strong)" }}>
              CryptoTrace Identity & Access Control
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Role-Based Access Control (RBAC) · Application Permissions Only · Demo accounts do not represent real personnel.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 hover:bg-[var(--hover)] text-muted transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex gap-2 mb-4 border-b pb-2" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => { setActiveTab("quick"); setError(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "quick"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "text-muted hover:text-white"
            }`}
          >
            ⚡ 1-Click Role Switcher (8 Personas)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("manual"); setError(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "manual"
                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                : "text-muted hover:text-white"
            }`}
          >
            🔑 Custom / Credentials Login
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Tab 1: 1-Click Persona Cards */}
        {activeTab === "quick" && (
          <div className="overflow-y-auto pr-1 space-y-2.5 flex-1 scroll-stable">
            <p className="text-[11px] text-muted">
              Select any of the 8 simulated roles to test differentiated dashboards, access barriers, and permissions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  disabled={loading}
                  onClick={() => handleQuickLogin(acc)}
                  className="flex flex-col text-left p-3 rounded-xl border transition hover:scale-[1.01] hover:border-sky-500/50 hover:bg-sky-500/5 group relative"
                  style={{
                    background: "var(--chip)",
                    borderColor: "var(--border)"
                  }}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold truncate group-hover:text-sky-400" style={{ color: "var(--text-strong)" }}>
                      {acc.name}
                    </span>
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: `${acc.tagColor}1a`,
                        color: acc.tagColor,
                        border: `1px solid ${acc.tagColor}44`
                      }}
                    >
                      {acc.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted leading-tight mb-1">
                    {acc.rank}
                  </div>
                  <div className="text-[10px] text-muted-2 leading-tight line-clamp-2 mt-auto">
                    {acc.abacFeature}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t text-[10px] font-mono text-muted" style={{ borderColor: "var(--border)" }}>
                    <span className="truncate max-w-[140px]">{acc.email}</span>
                    <span className="text-sky-400 font-semibold group-hover:underline">Switch →</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Manual Credentials Form */}
        {activeTab === "manual" && (
          <form onSubmit={handleLogin} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Government / User Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@example.demo or officer.patil@mhcyber.gov.in"
                required
                className="w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                style={{
                  background: "var(--chip)",
                  borderColor: "var(--border)",
                  color: "var(--text)"
                }}
              />
              <p className="text-[10px] text-muted mt-1">
                Accepts both prototype emails (e.g. <code>investigator@example.demo</code>) and backward-compatible logins.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Verified Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
                style={{
                  background: "var(--chip)",
                  borderColor: "var(--border)",
                  color: "var(--text)"
                }}
              />
            </div>

            <div className="rounded-xl border p-3 text-[11px] text-muted space-y-1" style={{ background: "var(--chip)", borderColor: "var(--border)" }}>
              <div className="font-semibold text-[11.5px]" style={{ color: "var(--text-strong)" }}>Prototype Seed Passwords:</div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <div>SI Patil: <code>Patil@123</code></div>
                <div>SP Deshmukh: <code>Deshmukh@123</code></div>
                <div>ACP Sharma: <code>Police@123</code></div>
                <div>VASP Exchange: <code>Compliance@123</code></div>
                <div>Court Reviewer: <code>Judge@123</code></div>
                <div>National Analyst: <code>National@123</code></div>
                <div>Victim Verma: <code>Victim@123</code></div>
                <div>System Admin: <code>Admin@123</code></div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition shadow-md disabled:opacity-50"
            >
              {loading ? "Verifying Credentials..." : "Authenticate Session"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
