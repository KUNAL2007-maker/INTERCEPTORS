"use client";

import { useTheme } from "./ThemeProvider";
import { useTraceStore } from "@/lib/store";
import { useAuth } from "./AuthProvider";
import { PAGE_GUTTER } from "./ui/Page";
import type { ViewKey } from "./AppShell";

const VIEW_TITLES: Record<ViewKey, { title: string; sub: string }> = {
  dashboard: { title: "Command Dashboard", sub: "Traced wallets, findings & the dual-track freeze decision" },
  transfers: { title: "Transfers", sub: "Every hop on the trail · search, filter & attribute" },
  graph: { title: "Wallet Flow Graph", sub: "Multi-chain money topology · victim entry → exchange deposit" },
  trace: { title: "Trace a Victim-Reported Wallet", sub: "Seed the case · walk the money outward hop by hop" },
  chat: { title: "AI Investigator · I4C", sub: "Ask in plain English · 4 specialist agents grounded in this trace" },
  notices: { title: "Legal Notices · Sec 94 BNSS", sub: "Draft & export statutory freeze requisitions to exchanges" },
  victim_portal: { title: "Citizen Fraud Victim Portal · NCRP 1930", sub: "Live recovery tracking & incident reporting" },
  audit_logs: { title: "Judicial Evidence Audit Chamber", sub: "BSA 2023 Sec 63 / 65B tamper-evident log inspection" },
  exchange_portal: { title: "Exchange Compliance Gateway", sub: "Inbound Section 94 BNSS statutory freezing directives" },
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
  const { title, sub } = VIEW_TITLES[view];
  const { user, openLoginModal, signOut } = useAuth();
  const { refreshing, trace, status, ingestNcrpComplaint } = useTraceStore();

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
      className="shrink-0 z-20 border-b backdrop-blur"
      style={{ borderColor: "var(--border)", background: "var(--panel-strong)" }}
    >
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
          <div className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
            CryptoTrace Intelligence · I4C NCRP
          </div>
          <div className="mt-0.5 text-[15px] sm:text-[18px] font-semibold leading-tight truncate" style={{ color: "var(--text-strong)" }}>
            {title}
          </div>
          <div className="hidden sm:block text-[11.5px] truncate" style={{ color: "var(--muted-2)" }}>{sub}</div>
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
                  user.role === 'VICTIM'
                    ? "bg-cyan-400"
                    : user.role === 'AUDITOR'
                    ? "bg-yellow-400"
                    : user.role === 'EXCHANGE_NODAL_OFFICER'
                    ? "bg-amber-400"
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
                      background: user.role === 'VICTIM' ? "#06b6d422" : user.is_gazetted ? "#10b98122" : "#f59e0b22",
                      color: user.role === 'VICTIM' ? "#06b6d4" : user.is_gazetted ? "#10b981" : "#f59e0b",
                      border: `1px solid ${user.role === 'VICTIM' ? "#06b6d444" : user.is_gazetted ? "#10b98144" : "#f59e0b44"}`
                    }}
                  >
                    {user.role === 'VICTIM'
                      ? 'CITIZEN'
                      : user.role === 'AUDITOR'
                      ? 'JUDICIAL'
                      : user.role === 'EXCHANGE_NODAL_OFFICER'
                      ? 'VASP DESK'
                      : user.is_gazetted
                      ? 'GAZETTED'
                      : 'NON-GAZETTED'}
                  </span>
                </div>
                <div className="text-[10px] text-muted leading-tight mt-0.5 truncate">
                  {user.role.replace(/_/g, " ")} {user.jurisdiction_code ? `· ${user.jurisdiction_code}` : ""}
                </div>
              </div>

              {/* Switch Role Button */}
              <button
                onClick={openLoginModal}
                title="Switch Evaluation Role or Sign In"
                className="ml-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition flex items-center gap-1"
              >
                <span>⇄</span>
                <span>Switch</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={signOut}
                title="Sign Out Session"
                className="text-[11px] p-1 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 transition"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 text-[12px] font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
            >
              <span>🔑</span>
              <span>Sign In</span>
            </button>
          )}

          {/* Live feed toggle */}
          <button
            onClick={onToggleFeed}
            aria-pressed={liveFeed}
            title={feedLabel}
            className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border px-2.5 sm:px-3 transition ${
              liveFeed
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 shadow-glow"
                : "hover:bg-[var(--hover)]"
            }`}
            style={!liveFeed ? { borderColor: "var(--border)", background: "var(--chip)", color: "var(--text)" } : undefined}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                !liveFeed
                  ? "bg-slate-500"
                  : armed
                    ? "bg-emerald-400 animate-blink"
                    : "bg-amber-400"
              }`}
            />
            <span className="hidden sm:inline text-[12px]">{feedLabel}</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 transition hover:bg-[var(--hover)]"
            style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--text)" }}
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
