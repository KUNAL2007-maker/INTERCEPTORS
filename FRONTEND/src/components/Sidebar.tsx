"use client";

import { useMemo } from "react";
import { useAuth } from "./AuthProvider";
import type { ViewKey } from "./AppShell";
import { normalizeRole, type RoleName } from "@/lib/rbac-abac";

type NavItem = {
  key: ViewKey;
  label: string;
  hint: string;
  badge?: string;
  icon: React.ReactNode;
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
  const rawRole = user?.role;
  const role = user ? normalizeRole(user.role) : null;

  const navItems = useMemo<NavItem[]>(() => {
    // 1. Citizen Fraud Victim Navigation
    if (role === "VICTIM") {
      return [
        {
          key: "victim_portal",
          label: "My Complaints",
          hint: "Recovery & status tracker",
          badge: "Citizen",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
      ];
    }

    // 2. High Court Judicial Auditor / Court Reviewer Navigation (Strictly Read-Only)
    if (role === "COURT_REVIEWER" || rawRole === "AUDITOR") {
      return [
        {
          key: "cases",
          label: "Evidence Dossiers",
          hint: "Read-only case files & hashes",
          badge: "Read Only",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          key: "audit_logs",
          label: "BSA Audit Trail & Cert",
          hint: "Sec 63/65B Logs & Cert",
          badge: "Judicial",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v18M3 8l9-5 9 5M6 13l-3 4h6l-3-4zM18 13l-3 4h6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          key: "graph",
          label: "Money Flow Review",
          hint: "Forensic canvas (Read Only)",
          badge: "Read Only",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="19" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M6.5 7.5L11 12M17.5 7.5L13 12M11 14L7 18M13 14l4 4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          ),
        }
      ];
    }

    // 3. VASP Compliance Officer Navigation (Exchange Desk)
    if (role === "VASP_COMPLIANCE_OFFICER" || rawRole === "EXCHANGE_NODAL_OFFICER") {
      return [
        {
          key: "exchange_portal",
          label: "Inbound Sec 94 BNSS",
          hint: "Freezes & KYC orders",
          badge: "VASP Desk",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10v4M15 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        }
      ];
    }

    // 4. National Coordination Analyst Navigation (I4C Hub)
    if (role === "NATIONAL_COORDINATION_ANALYST") {
      return [
        {
          key: "national_coordination",
          label: "National Intel Hub",
          hint: "Cross-jurisdiction links",
          badge: "I4C Hub",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          ),
        }
      ];
    }

    // 5. System Administrator Navigation
    if (role === "SYSTEM_ADMIN" || rawRole === "SUPER_ADMIN") {
      return [
        {
          key: "system_admin",
          label: "User & System Admin",
          hint: "Users & platform health",
          badge: "Admin",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          ),
        },
        {
          key: "audit_logs",
          label: "Security Audit Logs",
          hint: "Platform access logs",
          badge: "Security",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v18M3 8l9-5 9 5M6 13l-3 4h6l-3-4zM18 13l-3 4h6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        }
      ];
    }

    // 6. Cybercrime Supervisor Navigation (SP Deshmukh)
    if (role === "CYBERCRIME_SUPERVISOR") {
      return [
        {
          key: "dashboard",
          label: "Unit Triage & Allocation",
          hint: "SP Deshmukh • Case Triage & IO Assignment",
          badge: "Supervisor",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          key: "audit_logs",
          label: "Unit Audit Trail",
          hint: "BSA 2023 Sec 63/65B",
          badge: "Supervisory",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v18M3 8l9-5 9 5M6 13l-3 4h6l-3-4zM18 13l-3 4h6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
      ];
    }

    // 7. Senior Investigator Navigation (ACP Sharma - Gazetted)
    if (role === "SENIOR_INVESTIGATOR") {
      return [
        {
          key: "dashboard",
          label: "Traced Cases & Sign-Off",
          hint: "ACP Sharma • Review & Sign-Off",
          badge: "Gazetted",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          key: "graph",
          label: "Money Flow Graph",
          hint: "Trace topology review",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="19" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M6.5 7.5L11 12M17.5 7.5L13 12M11 14L7 18M13 14l4 4" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          ),
        },
        {
          key: "notices",
          label: "Sign Sec 94 BNSS Order",
          hint: "Digital statutory sign-off",
          badge: "Sec 94 BNSS",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 3h8l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M15 3v5h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ),
        },
        {
          key: "audit_logs",
          label: "Unit Audit Trail",
          hint: "BSA 2023 Sec 63/65B",
          badge: "Supervisory",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v18M3 8l9-5 9 5M6 13l-3 4h6l-3-4zM18 13l-3 4h6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
      ];
    }

    // 8. Investigating Officer Navigation (SI Patil - Field IO)
    return [
      {
        key: "dashboard",
        label: "Assigned Cases & Trace",
        hint: "SI Patil • Active dockets",
        badge: "Assigned",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        key: "graph",
        label: "Money Flow Graph",
        hint: "Blockchain trace topology",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="19" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="6" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="18" cy="19" r="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M6.5 7.5L11 12M17.5 7.5L13 12M11 14L7 18M13 14l4 4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        ),
      },
      {
        key: "chat",
        label: "AI Forensics Copilot",
        hint: "4 forensic agents",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16v10H8l-4 3V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="9" cy="11" r="1" fill="currentColor" />
            <circle cx="12" cy="11" r="1" fill="currentColor" />
            <circle cx="15" cy="11" r="1" fill="currentColor" />
          </svg>
        ),
      },
      {
        key: "notices",
        label: "Prepare Draft Notice",
        hint: "Sec 94 BNSS Draft Only",
        badge: "Draft Only",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 3h8l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M15 3v5h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ),
      },
    ];
  }, [role, rawRole]);

  // Role Pill Configuration
  const roleBadge = useMemo(() => {
    switch (role) {
      case "VICTIM":
        return { label: "CITIZEN COMPLAINANT · NCRP 1930", bg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25" };
      case "COURT_REVIEWER":
        return { label: "JUDICIAL EVIDENCE REVIEWER (READ ONLY)", bg: "bg-slate-500/10 text-slate-300 border-slate-500/25" };
      case "VASP_COMPLIANCE_OFFICER":
        return { label: "VASP COMPLIANCE DESK · EXTERNAL", bg: "bg-amber-500/10 text-amber-300 border-amber-500/25" };
      case "INVESTIGATING_OFFICER":
        return { label: "SI PATIL (FIELD INVESTIGATOR)", bg: "bg-amber-500/10 text-amber-300 border-amber-500/25" };
      case "CYBERCRIME_SUPERVISOR":
        return { label: "SP DESHMUKH (UNIT SUPERVISOR)", bg: "bg-purple-500/10 text-purple-300 border-purple-500/25" };
      case "SENIOR_INVESTIGATOR":
        return { label: "ACP SHARMA (GAZETTED · SEC 94 BNSS)", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" };
      case "NATIONAL_COORDINATION_ANALYST":
        return { label: "NATIONAL COORDINATION ANALYST", bg: "bg-sky-500/10 text-sky-300 border-sky-500/25" };
      case "SYSTEM_ADMIN":
        return { label: "SYSTEM ADMINISTRATOR · INFRASTRUCTURE", bg: "bg-rose-500/10 text-rose-300 border-rose-500/25" };
      default:
        return { label: "LAW ENFORCEMENT PROTOTYPE", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" };
    }
  }, [role]);

  return (
    <aside
      id="app-nav"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[272px] shrink-0 flex-col border-r transition-transform duration-300 lg:static lg:z-auto lg:h-full lg:w-64 lg:translate-x-0 lg:transition-none 2xl:w-72 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      {/* Brand & Badge Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-400 font-bold text-sm border border-sky-500/20 shadow-sm">
            CT
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight" style={{ color: "var(--text-strong)" }}>
              CryptoTrace
            </div>
            <div className="text-[10px] text-muted">I4C / NCRP Platform</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-[var(--hover)] lg:hidden"
          >
            ✕
          </button>
        )}
      </div>

      {/* Role Pill */}
      <div className="px-3 pt-3">
        <div className={`rounded-lg border px-2.5 py-1 text-[9.5px] font-mono font-bold tracking-wider uppercase text-center ${roleBadge.bg}`}>
          {roleBadge.label}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 scroll-stable">
        {navItems.map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onChange(item.key);
                if (onClose) onClose();
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                active
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm"
                  : "text-muted hover:bg-[var(--hover)] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`shrink-0 ${active ? "text-sky-400" : "text-muted"}`}>
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className={`truncate leading-tight ${active ? "font-bold text-white" : ""}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-muted-2 truncate leading-tight mt-0.5">
                    {item.hint}
                  </div>
                </div>
              </div>
              {item.badge && (
                <span className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold ${
                  item.badge === "Read Only"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-[var(--chip)] text-muted"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Officer Chip */}
      <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
        <OfficerChip />
      </div>
    </aside>
  );
}

function OfficerChip() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const normRole = normalizeRole(user.role);

  const roleLabel =
    normRole === "VICTIM"
      ? "Citizen Complainant"
      : normRole === "COURT_REVIEWER"
      ? "Judicial Reviewer (Read Only)"
      : normRole === "VASP_COMPLIANCE_OFFICER"
      ? "VASP Compliance Desk"
      : normRole === "NATIONAL_COORDINATION_ANALYST"
      ? "National Coordination Analyst"
      : normRole === "SYSTEM_ADMIN"
      ? "System Administrator"
      : normRole === "CYBERCRIME_SUPERVISOR"
      ? "Cybercrime Supervisor"
      : user.is_gazetted
      ? "Gazetted Senior Police Officer"
      : "Field Investigating Officer";

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--chip)] border" style={{ borderColor: "var(--border)" }}>
      <div
        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs shadow-sm"
        style={{
          background:
            normRole === "VICTIM"
              ? "linear-gradient(135deg, #06b6d4, #0891b2)"
              : normRole === "COURT_REVIEWER"
              ? "linear-gradient(135deg, #64748b, #475569)"
              : normRole === "NATIONAL_COORDINATION_ANALYST"
              ? "linear-gradient(135deg, #38bdf8, #0284c7)"
              : normRole === "SYSTEM_ADMIN"
              ? "linear-gradient(135deg, #f43f5e, #e11d48)"
              : user.is_gazetted
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#fff"
        }}
      >
        {user.name ? user.name.slice(0, 2).toUpperCase() : "IO"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-white truncate">{user.name || user.fullName}</div>
        <div className="text-[10px] text-muted truncate">{roleLabel}</div>
      </div>
      <button
        onClick={() => signOut()}
        title="Sign Out"
        className="p-1 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 transition text-xs"
      >
        ✕
      </button>
    </div>
  );
}
