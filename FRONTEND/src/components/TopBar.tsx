"use client";

import { useTheme } from "./ThemeProvider";
import { useTraceStore } from "@/lib/store";
import { useAuth } from "./AuthProvider";
import { PAGE_GUTTER } from "./ui/Page";
import type { ViewKey } from "./AppShell";
import { normalizeRole } from "@/lib/rbac-abac";

const VIEW_TITLES: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Command Dashboard", sub: "Traced wallets, findings & supervisory overview" },
  transfers: { title: "Transfers", sub: "Every hop on the trail · search, filter & attribute" },
  graph: { title: "Wallet Flow Graph", sub: "Multi-chain money topology · victim entry → exchange deposit" },
  trace: { title: "Trace a Victim-Reported Wallet", sub: "Seed the case · walk the money outward hop by hop" },
  chat: { title: "AI Investigator · I4C", sub: "Ask in plain English · 4 specialist agents grounded in this trace" },
  notices: { title: "Legal Notices · Sec 94 BNSS", sub: "Draft & export statutory freeze requisitions to exchanges" },
  victim_portal: { title: "Citizen Fraud Victim Portal · NCRP 1930", sub: "Live recovery tracking & complaint management" },
  cases: { title: "Complaints & Case Dossiers", sub: "NCRP 1930 triage, investigator assignments & status workflow" },
  audit_logs: { title: "Judicial Evidence Audit Chamber", sub: "BSA 2023 Sec 63 / 65B tamper-evident log inspection" },
  exchange_portal: { title: "Exchange Compliance Gateway", sub: "Inbound Section 94 BNSS statutory freezing directives" },
  national_coordination: { title: "National Coordination Intelligence Hub", sub: "Cross-jurisdictional indicator correlation & multi-state clusters" },
  system_admin: { title: "System Administration & Health Console", sub: "User management, platform infrastructure & security audit logs" }
};

export function TopBar({
  view,
  liveFeed,
  onToggleFeed,
  onOpenNav,
}: {
  view: ViewKey;
  liveFeed: boolean;
  onToggleFeed: () => void;
  onOpenNav?: () => void;
}) {
  const { theme, toggle } = useTheme();
  const viewInfo = VIEW_TITLES[view] || { title: "CryptoTrace Intelligence", sub: "Cybercrime Investigation Platform" };
  const { user, openLoginModal, signOut } = useAuth();
  const { refreshing, trace, status } = useTraceStore();
  const normRole = user ? normalizeRole(user.role) : null;

  const armed = liveFeed && !!trace && status === "ready";
  const feedLabel = !liveFeed
    ? "Live feed · paused"
    : refreshing
      ? "Live feed · refreshing…"
      : armed
        ? "Live feed · ON"
        : "Live feed · no trace";

  return (
    <header
      className="shrink-0 z-20 border-b backdrop-blur flex flex-col"
      style={{ borderColor: "var(--border)", background: "var(--panel-strong)" }}
    >
      {/* ⚠️ Prototype & Simulated LEA Environment Mandatory Banner */}
      <div
        className="w-full py-1 px-3 text-center text-[10.5px] font-medium tracking-wide flex items-center justify-center gap-2 border-b"
        style={{
          background: "linear-gradient(90deg, rgba(245,158,11,0.12) 0%, rgba(59,130,246,0.12) 50%, rgba(245,158,11,0.12) 100%)",
          borderColor: "var(--border)",
          color: "var(--muted)"
        }}
      >
        <span className="font-bold text-amber-400">SIH 2026 Prototype / Simulated LEA Environment</span>
        <span className="hidden md:inline text-muted">·</span>
        <span className="hidden md:inline">For Demonstration Purposes Only · Demo accounts do not represent real government personnel · Application permissions hierarchy only</span>
      </div>

      <div className={`mx-auto w-full max-w-[1760px] ${PAGE_GUTTER} flex flex-wrap items-center gap-2 sm:gap-4 py-2.5`}>
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenNav}
          aria-label="Open navigation"
          aria-controls="app-nav"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition hover:bg-[var(--hover)] lg:hidden"
          style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
              CryptoTrace Intelligence · I4C NCRP
            </span>
            {/* Court Reviewer READ ONLY Badge */}
            {(normRole === 'COURT_REVIEWER' || user?.role === 'AUDITOR') && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30 animate-pulse">
                ⚖️ READ ONLY
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[15px] sm:text-[18px] font-semibold leading-tight truncate" style={{ color: "var(--text-strong)" }}>
            {viewInfo.title}
          </div>
          <div className="hidden sm:block text-[11.5px] truncate" style={{ color: "var(--muted-2)" }}>{viewInfo.sub}</div>
        </div>

        {/* Right controls: User Persona, Live feed & Theme */}
        <div className="ml-auto flex shrink-0 items-center flex-wrap gap-2 sm:gap-3">
          {/* User Profile Badge & Persona Switcher */}
          {user ? (
            <div
              className="flex items-center gap-2.5 rounded-xl border px-3 py-1.5 shadow-sm"
              style={{
                background: "var(--chip)",
                borderColor: "var(--border)"
              }}
            >
              {/* Gazetted / Role Status Indicator */}
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                  normRole === 'VICTIM'
                    ? "bg-cyan-400"
                    : normRole === 'COURT_REVIEWER'
                    ? "bg-slate-400"
                    : normRole === 'VASP_COMPLIANCE_OFFICER'
                    ? "bg-amber-400"
                    : normRole === 'NATIONAL_COORDINATION_ANALYST'
                    ? "bg-sky-400"
                    : normRole === 'SYSTEM_ADMIN'
                    ? "bg-rose-500"
                    : user.is_gazetted
                    ? "bg-emerald-400 shadow-glow"
                    : "bg-amber-400"
                }`}
                title={user.is_gazetted ? "Gazetted Officer (Sec 94 BNSS Authorized)" : user.role}
              />

              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-2 leading-tight">
                  <span className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text-strong)" }}>
                    {user.name || user.fullName}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background:
                        normRole === 'VICTIM'
                          ? "#06b6d422"
                          : normRole === 'COURT_REVIEWER'
                          ? "#94a3b822"
                          : normRole === 'VASP_COMPLIANCE_OFFICER'
                          ? "#eab30822"
                          : normRole === 'NATIONAL_COORDINATION_ANALYST'
                          ? "#38bdf822"
                          : normRole === 'SYSTEM_ADMIN'
                          ? "#f43f5e22"
                          : user.is_gazetted
                          ? "#10b98122"
                          : "#f59e0b22",
                      color:
                        normRole === 'VICTIM'
                          ? "#06b6d4"
                          : normRole === 'COURT_REVIEWER'
                          ? "#94a3b8"
                          : normRole === 'VASP_COMPLIANCE_OFFICER'
                          ? "#eab308"
                          : normRole === 'NATIONAL_COORDINATION_ANALYST'
                          ? "#38bdf8"
                          : normRole === 'SYSTEM_ADMIN'
                          ? "#f43f5e"
                          : user.is_gazetted
                          ? "#10b981"
                          : "#f59e0b",
                      border: `1px solid ${
                        normRole === 'VICTIM'
                          ? "#06b6d444"
                          : normRole === 'COURT_REVIEWER'
                          ? "#94a3b844"
                          : normRole === 'VASP_COMPLIANCE_OFFICER'
                          ? "#eab30844"
                          : normRole === 'NATIONAL_COORDINATION_ANALYST'
                          ? "#38bdf844"
                          : normRole === 'SYSTEM_ADMIN'
                          ? "#f43f5e44"
                          : user.is_gazetted
                          ? "#10b98144"
                          : "#f59e0b44"
                      }`
                    }}
                  >
                    {normRole === 'VICTIM'
                      ? 'CITIZEN'
                      : normRole === 'COURT_REVIEWER'
                      ? 'READ ONLY'
                      : normRole === 'VASP_COMPLIANCE_OFFICER'
                      ? 'VASP DESK'
                      : normRole === 'NATIONAL_COORDINATION_ANALYST'
                      ? 'NATIONAL'
                      : normRole === 'SYSTEM_ADMIN'
                      ? 'SYS ADMIN'
                      : user.is_gazetted
                      ? 'GAZETTED'
                      : 'NON-GAZETTED'}
                  </span>
                </div>
                <div className="text-[10px] text-muted leading-tight mt-0.5 truncate">
                  {user.role.replace(/_/g, " ")} {user.jurisdiction_code ? `· ${user.jurisdiction_code}` : ""}
                </div>
              </div>

              {/* Role Switcher Button */}
              <button
                onClick={openLoginModal}
                title="Switch Persona / Login"
                className="ml-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 hover:underline px-1.5 py-0.5 rounded transition"
              >
                Switch
              </button>

              <button
                onClick={() => signOut()}
                title="Sign out"
                className="text-muted hover:text-rose-400 transition p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md transition"
            >
              Sign In
            </button>
          )}

          {/* Theme switch button */}
          <button
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            className="grid h-8 w-8 place-items-center rounded-lg border transition hover:bg-[var(--hover)] text-muted"
            style={{ borderColor: "var(--border)", background: "var(--chip)" }}
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
