"use client";

import { useMemo } from "react";
import { useAuth } from "./AuthProvider";
import { viewsForRole, type NavGroup, type ViewKey } from "@/lib/access";
import { normalizeRole } from "@/lib/rbac-abac";

/**
 * Navigation is derived entirely from `viewsForRole`, the same allow-list the
 * view gate uses. There is no per-role nav array here and no default branch:
 * a role sees an entry if and only if it may open that view.
 */

const ICONS: Record<ViewKey, React.ReactNode> = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  cases: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  trace: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  graph: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 7.5L11 12M17.5 7.5L13 12M11 14L7 18M13 14l4 4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  canvas: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="14" cy="16" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.4 10.6l5.2-1.8M9.1 11.3l3.9 3.9M15.3 9.4l-.9 5.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  monitor: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7M5.8 5.8a9 9 0 000 12.4M18.2 5.8a9 9 0 010 12.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  transfers: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h13l-3-3M20 17H7l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chat: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16v10H8l-4 3V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 11h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  notices: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 3h8l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M15 3v5h4M10 12h5M10 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  audit_logs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v18M3 8l9-5 9 5M6 13l-3 4h6l-3-4zM18 13l-3 4h6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  victim_portal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  exchange_portal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 21h18M5 21V7l7-4 7 4v14M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  national_coordination: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  ),
  system_admin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

const GROUP_ORDER: NavGroup[] = ["Case Work", "Analysis", "Statutory", "Oversight", "Administration"];

/** Role designation, derived from the role rather than the individual holder. */
const ROLE_DESIGNATION: Record<string, string> = {
  VICTIM: "Complainant · NCRP 1930",
  INVESTIGATING_OFFICER: "Investigating Officer",
  CYBERCRIME_SUPERVISOR: "Cybercrime Unit Supervisor",
  SENIOR_INVESTIGATOR: "Gazetted Officer · Sec 94 BNSS",
  VASP_COMPLIANCE_OFFICER: "VASP Compliance Desk",
  COURT_REVIEWER: "Judicial Reviewer · Read Only",
  NATIONAL_COORDINATION_ANALYST: "National Coordination · I4C",
  SYSTEM_ADMIN: "System Administrator",
};

export function Sidebar({
  view,
  onChange,
  open = false,
  onClose,
}: {
  view: ViewKey;
  onChange: (v: ViewKey) => void;
  open?: boolean;
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const role = user ? normalizeRole(user.role) : null;

  const grouped = useMemo(() => {
    const items = viewsForRole(user?.role);
    const byGroup = new Map<NavGroup, typeof items>();
    for (const item of items) {
      const list = byGroup.get(item.group) || [];
      list.push(item);
      byGroup.set(item.group, list);
    }
    // Only render a group heading when the role has more than one group,
    // otherwise the heading is noise above a single item.
    return {
      showHeadings: byGroup.size > 1,
      groups: GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({ group: g, items: byGroup.get(g)! })),
    };
  }, [user?.role]);

  const designation = (role && ROLE_DESIGNATION[role]) || "Authorised User";
  const readOnly = role === "COURT_REVIEWER";

  return (
    <aside
      id="app-nav"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[264px] shrink-0 flex-col border-r transition-transform duration-200 lg:static lg:z-auto lg:h-full lg:w-64 lg:translate-x-0 lg:transition-none ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ background: "var(--panel)", borderColor: "var(--border)" }}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4" style={{ borderColor: "var(--border)" }}>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--text-strong)" }}>
            CryptoTrace
          </div>
          <div className="text-[10px] text-muted truncate">Crypto Fraud Attribution · I4C</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-7 w-7 place-items-center rounded border text-muted hover:text-white lg:hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Role designation. Describes the office, not the person holding it. */}
      <div className="px-3 pt-3">
        <div
          className="rounded border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-center"
          style={{
            borderColor: readOnly ? "rgba(148,163,184,0.35)" : "var(--border)",
            background: "var(--chip)",
            color: "var(--text-muted, #94a3b8)",
          }}
        >
          {designation}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 scroll-stable">
        {grouped.groups.map(({ group, items }) => (
          <div key={group} className="mb-4 last:mb-0">
            {grouped.showHeadings && (
              <div className="px-1 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-2">
                {group}
              </div>
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const active = view === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onChange(item.key);
                      if (onClose) onClose();
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-start gap-2.5 rounded border px-2.5 py-2 text-left transition ${
                      active
                        ? "border-sky-500/40 bg-sky-500/10"
                        : "border-transparent text-muted hover:bg-[var(--hover)]"
                    }`}
                  >
                    <span className={`mt-0.5 shrink-0 ${active ? "text-sky-400" : "text-muted-2"}`}>
                      {ICONS[item.key]}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-[12px] leading-tight ${
                          active ? "font-semibold text-white" : "font-medium"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted-2">
                        {item.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
        <OfficerChip designation={designation} />
      </div>
    </aside>
  );
}

function OfficerChip({ designation }: { designation: string }) {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const initials = (user.name || user.fullName || "U").trim().slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-2.5 rounded border p-2.5" style={{ borderColor: "var(--border)", background: "var(--chip)" }}>
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded border text-[11px] font-semibold"
        style={{ borderColor: "var(--border)", background: "var(--surface-sunken)", color: "var(--text-strong)" }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-white">{user.name || user.fullName}</div>
        <div className="truncate text-[10px] text-muted">{designation}</div>
      </div>
      <button
        onClick={() => signOut()}
        title="Sign out"
        aria-label="Sign out"
        className="rounded p-1 text-muted transition hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 8l-4 4 4 4M6 12h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
