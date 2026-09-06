"use client";

import { useTheme } from "./ThemeProvider";
import { useTraceStore } from "@/lib/store";
import { useAuth } from "./AuthProvider";
import { SYSTEM_PERSONAS } from "@/lib/rbac-abac";
import { PAGE_GUTTER } from "./ui/Page";
import type { ViewKey } from "./AppShell";

const VIEW_TITLES: Record<ViewKey, { title: string; sub: string }> = {
  dashboard: { title: "Command Dashboard", sub: "Traced wallets, findings & the dual-track freeze decision" },
  transfers: { title: "Transfers", sub: "Every hop on the trail · search, filter & attribute" },
  graph: { title: "Wallet Flow Graph", sub: "Multi-chain money topology · victim entry → exchange deposit" },
  trace: { title: "Trace a Victim-Reported Wallet", sub: "Seed the case · walk the money outward hop by hop" },
  chat: { title: "AI Investigator · I4C", sub: "Ask in plain English · 4 specialist agents grounded in this trace" },
  notices: { title: "Legal Notices · Sec 94 BNSS", sub: "Draft & export statutory freeze requisitions to exchanges" },
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
  const { user, switchRole } = useAuth();
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
          <div className="flex items-center gap-2">
            <div className="text-[11px] uppercase tracking-widest truncate" style={{ color: "var(--muted)" }}>
              CryptoTrace Intelligence
            </div>
            <span className="hidden sm:inline text-[10px] rounded px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              POSTGRESQL &bull; SEC 94 BNSS
            </span>
          </div>
          <div className="mt-0.5 text-[15px] sm:text-[18px] font-semibold leading-tight truncate" style={{ color: "var(--text-strong)" }}>
            {title}
          </div>
          <div className="hidden sm:block text-[12px] truncate" style={{ color: "var(--muted-2)" }}>{sub}</div>
        </div>

        {/* Right controls: Ingest 1930, Persona Switcher, Live feed & Theme */}
        <div className="ml-auto flex shrink-0 items-center flex-wrap gap-1.5 sm:gap-2.5">
          {/* Quick 1930 / NCRP Ingest Button */}
          <button
            onClick={() => ingestNcrpComplaint()}
            title="Simulate Real-Time Ingestion from NCRP / 1930 Helpline"
            className="flex h-9 items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 sm:px-3 text-[12px] font-medium text-indigo-200 transition hover:bg-indigo-500/25 shadow-glow"
          >
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            <span>⚡ Ingest 1930/NCRP</span>
          </button>

          {/* 7-Persona Switcher Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1 bg-[var(--chip)]" style={{ borderColor: "var(--border)" }}>
            <span className="text-[11px] font-medium hidden md:inline" style={{ color: "var(--muted)" }}>Role:</span>
            <select
              value={user?.role || "SENIOR_INVESTIGATOR"}
              onChange={(e) => switchRole(e.target.value)}
              className="bg-transparent text-[12px] font-medium focus:outline-none cursor-pointer"
              style={{ color: "var(--text-strong)" }}
            >
              {SYSTEM_PERSONAS.map((p) => (
                <option key={p.role} value={p.role} className="bg-slate-900 text-slate-100">
                  {p.name} ({p.role.replace(/_/g, " ")})
                </option>
              ))}
            </select>
          </div>

          {/* Jurisdiction & Clearance Badges */}
          {user?.jurisdiction_code && (
            <span className="hidden lg:inline-flex items-center text-[11px] font-mono px-2 py-1 rounded border bg-blue-500/10 text-blue-300 border-blue-500/25">
              {user.jurisdiction_code}
            </span>
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
