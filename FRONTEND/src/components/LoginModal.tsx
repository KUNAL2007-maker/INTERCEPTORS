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
    email: "senior.sharma@mhcyber.gov.in",
    password: "Police@123",
    role: "SENIOR_INVESTIGATOR",
    name: "Officer Sharma (ACP)",
    rank: "Gazetted Officer (ACP / DSP)",
    jurisdiction: "MH-CYBER-01",
    abacFeature: "Authorized to issue statutory Sec 94 BNSS asset freezes",
    tagColor: "#10b981"
  },
  {
    email: "officer.patil@mhcyber.gov.in",
    password: "Patil@123",
    role: "NORMAL_INVESTIGATOR",
    name: "Sub-Inspector Patil",
    rank: "Non-Gazetted Field Investigator",
    jurisdiction: "MH-CYBER-01",
    abacFeature: "ABAC Gate: Blocked from issuing Sec 94 BNSS (Non-Gazetted)",
    tagColor: "#f59e0b"
  },
  {
    email: "admin@i4c.gov.in",
    password: "Admin@123",
    role: "SUPER_ADMIN",
    name: "Central Nodal Officer (I4C)",
    rank: "National Directorate",
    jurisdiction: "IN-I4C-00 (Pan-India)",
    abacFeature: "Full national scope, Emergency Lockdown killswitch",
    tagColor: "#ef4444"
  },
  {
    email: "sp.deshmukh@mhcyber.gov.in",
    password: "Deshmukh@123",
    role: "WORKSPACE_ADMIN",
    name: "SP Deshmukh (MH Lead)",
    rank: "Superintendent of Police",
    jurisdiction: "MH-CYBER-01",
    abacFeature: "State Workspace management, Officer account delegation",
    tagColor: "#8b5cf6"
  },
  {
    email: "victim.verma@gmail.com",
    password: "Victim@123",
    role: "VICTIM",
    name: "Rajesh Verma (Victim)",
    rank: "Citizen / Complainant",
    jurisdiction: "Public User",
    abacFeature: "Strict Privacy Isolation: View only own filed complaints",
    tagColor: "#06b6d4"
  },
  {
    email: "legal@binance.com",
    password: "Binance@123",
    role: "EXCHANGE_NODAL_OFFICER",
    name: "Binance Compliance Officer",
    rank: "VASP External Officer",
    jurisdiction: "Binance Int.",
    abacFeature: "VASP Isolation: Accesses only Binance Section 94 orders",
    tagColor: "#eab308"
  },
  {
    email: "judge.rao@ecourts.gov.in",
    password: "Judge@123",
    role: "AUDITOR",
    name: "Justice K. S. Rao",
    rank: "High Court Judicial Auditor",
    jurisdiction: "IN-JUDICIAL-00",
    abacFeature: "Strict Read-Only: BSA Sec 63 / 65B Audit trail access",
    tagColor: "#64748b"
  }
];

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please enter both official email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const err = await signIn(email, password);
      if (err) {
        setError(err);
      } else {
        onClose();
      }
    } catch (ex: any) {
      setError(ex?.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
    setLoading(true);
    try {
      const err = await signIn(acc.email, acc.password);
      if (err) {
        setError(err);
      } else {
        onClose();
      }
    } catch (ex: any) {
      setError(ex?.message || "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        style={{
          background: "#0d1117",
          borderColor: "var(--border)",
          color: "var(--text-strong)"
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-white transition text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #22c55e, #10b981)", color: "#000" }}
          >
            I4C
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Official Law Enforcement Authentication</h2>
            <p className="text-xs text-muted">
              National Cybercrime Reporting Portal · 7-Role RBAC & Statutory ABAC Engine
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Standard Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-3 mb-6">
          <div>
            <label className="block text-xs font-semibold mb-1 text-muted">
              Official Gov ID / Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. senior.sharma@mhcyber.gov.in"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              style={{
                background: "var(--surface-sunken)",
                borderColor: "var(--border)",
                color: "var(--text-strong)"
              }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-muted">
              Password (PBKDF2 Salted Hash)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              style={{
                background: "var(--surface-sunken)",
                borderColor: "var(--border)",
                color: "var(--text-strong)"
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-black transition disabled:opacity-50 mt-2"
            style={{
              background: "linear-gradient(135deg, #22c55e, #10b981)"
            }}
          >
            {loading ? "Verifying Credentials & Issuing JWT..." : "Authenticate & Issue Cryptographic Token"}
          </button>
        </form>

        {/* SIH Jury Quick-Fill Profiles */}
        <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <span>⚡</span> SIH 2026 Jury Evaluation Profiles (1-Click Real Auth)
            </h3>
            <span className="text-[10px] text-muted">Auto-fills credentials & issues JWT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className="text-left p-2.5 rounded-xl border hover:border-emerald-500/50 transition group flex flex-col justify-between"
                style={{
                  background: "var(--surface-sunken)",
                  borderColor: "var(--border)"
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold group-hover:text-emerald-400 transition">
                    {acc.name}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium"
                    style={{
                      background: `${acc.tagColor}22`,
                      color: acc.tagColor,
                      border: `1px solid ${acc.tagColor}44`
                    }}
                  >
                    {acc.role}
                  </span>
                </div>
                <div className="text-[11px] text-muted truncate">{acc.email} · pwd: {acc.password}</div>
                <div className="text-[10px] text-muted/80 mt-1 flex items-center gap-1">
                  <span>🎯</span>
                  <span className="truncate">{acc.abacFeature}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
