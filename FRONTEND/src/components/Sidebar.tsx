"use client";

import { useMemo } from "react";
import { useAuth } from "./AuthProvider";
import type { ViewKey } from "./AppShell";
import type { RoleName } from "@/lib/rbac-abac";

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
  const role = user?.role;

  const navItems = useMemo<NavItem[]>(() => {
    // 1. Citizen Fraud Victim Navigation
    if (role === "VICTIM") {
      return [
        {
          key: "victim_portal",
          label: "My Complaints",
          hint: "Recovery tracker",
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

    // 2. High Court Judicial Auditor Navigation
    if (role === "AUDITOR") {
      return [
        {
          key: "audit_logs",
          label: "BSA Audit Trail",
          hint: "Sec 63/65B Logs",
          badge: "Judicial",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v18M3 8l9-5 9 5M6 13l-3 4h6l-3-4zM18 13l-3 4h6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          key: "dashboard",
          label: "Evidence Dossiers",
          hint: "Read-only cases",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          key: "cases",
          label: "Case Dossiers",
          hint: "NCRP intake review",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          key: "graph",
          label: "Money Flow Review",
          hint: "Forensic canvas",
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

    // 3. Exchange Nodal Officer (Binance) Navigation
    if (role === "EXCHANGE_NODAL_OFFICER") {
      return [
        {
          key: "exchange_portal",
          label: "Inbound Sec 94 BNSS",
          hint: "Freezes & KYC orders",
          badge: "Exchange",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10v4M15 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ),
        },
        {
          key: "notices",
          label: "Compliance Dossiers",
          hint: "Legal orders",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M7 3h8l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M15 3v5h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          ),
        }
      ];
    }

    // 4. Investigators & Super Admin Navigation
    const items: NavItem[] = [
      {
        key: "dashboard",
        label: "Command Dashboard",
        hint: "Overview & signals",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        key: "cases",
        label: "Complaints & Cases",
        hint: "NCRP 1930 inbox",
        badge: "NCRP",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        key: "trace",
        label: "Trace Wallet",
        hint: "Seed a case",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
            <path d="M16 16l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        key: "graph",
        label: "Wallet Flow Graph",
        hint: "Network canvas",
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
        key: "transfers",
        label: "Transfers",
        hint: "Browse & filter",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        key: "notices",
        label: "Legal Notices",
        hint: role === "NORMAL_INVESTIGATOR" ? "Draft Only (Non-Gazetted)" : "Sec 94 BNSS",
        badge: role === "NORMAL_INVESTIGATOR" ? "Draft" : undefined,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 3h8l4 4v14H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M15 3v5h4M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        key: "chat",
        label: "AI Investigator",
        hint: "I4C multi-agent",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16v10H8l-4 3V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <circle cx="9" cy="11" r="1" fill="currentColor" />
            <circle cx="12" cy="11" r="1" fill="currentColor" />
            <circle cx="15" cy="11" r="1" fill="currentColor" />
          </svg>
        ),
      },
    ];

    if (role === "SUPER_ADMIN") {
      items.push({
        key: "audit_logs",
        label: "National Audit Logs",
        hint: "Central oversight",
        badge: "I4C",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v18M3 8l9-5 9 5M6 13l-3 4h6l-3-4zM18 13l-3 4h6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      });
    }

    return items;
  }, [role]);

  // Role Pill Config
  const roleBadge = useMemo(() => {
    switch (role) {
      case "VICTIM":
        return { label: "CITIZEN COMPLAINANT · NCRP 1930", bg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/25" };
      case "AUDITOR":
        return { label: "JUDICIAL EVIDENCE AUDITOR · BSA 65B", bg: "bg-yellow-500/10 text-yellow-300 border-yellow-500/25" };
      case "EXCHANGE_NODAL_OFFICER":
        return { label: "BINANCE COMPLIANCE DESK · VASP", bg: "bg-amber-500/10 text-amber-300 border-amber-500/25" };
      case "NORMAL_INVESTIGATOR":
        return { label: "FIELD INVESTIGATOR (SUB-INSPECTOR)", bg: "bg-amber-500/10 text-amber-300 border-amber-500/25" };
      case "SENIOR_INVESTIGATOR":
        return { label: "ACP SHARMA (GAZETTED · SEC 94 BNSS)", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" };
      case "SUPER_ADMIN":
        return { label: "CENTRAL NODAL OFFICER · I4C PAN-INDIA", bg: "bg-rose-500/10 text-rose-300 border-rose-500/25" };
      case "WORKSPACE_ADMIN":
        return { label: "SP DESHMUKH (STATE UNIT LEAD)", bg: "bg-purple-500/10 text-purple-300 border-purple-500/25" };
      default:
        return { label: "LAW ENFORCEMENT", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25" };
    }
  }, [role]);

  return (
    <aside
      id="app-nav"
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[272px] shrink-0 flex-col border-r transition-transform duration-300 lg:static lg:z-auto lg:h-full lg:w-64 lg:translate-x-0 lg:transition-none 2xl:w-72 ${
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      }`}
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center gap-3">
        <div className="relative w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-700 grid place-items-center shadow-glow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="#052e1a" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(255,255,255,0.15)" />
            <path d="M9 12l2 2 4-4" stroke="#052e1a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-wide truncate" style={{ color: "var(--text-strong)" }}>
            CryptoTrace <span className="text-emerald-400">Intelligence</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest truncate" style={{ color: "var(--muted)" }}>
            NCRP · I4C Forensic Platform
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close navigation"
          className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-md border transition hover:bg-[var(--hover)] lg:hidden"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Active Persona Banner in Sidebar */}
      <div className="px-4 pb-3">
        <div className={`text-[9px] font-mono px-2 py-1 rounded border tracking-wider font-semibold truncate ${roleBadge.bg}`}>
          {roleBadge.label}
        </div>
      </div>

      <div className="h-px shrink-0" style={{ background: "var(--border)" }} />

      {/* Role-Specific Navigation Menu */}
      <nav className="p-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onChange(item.key);
                onClose?.();
              }}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                active
                  ? "bg-emerald-500/10 text-emerald-300 font-medium shadow-sm"
                  : "text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text-strong)]"
              }`}
            >
              <span className={`shrink-0 ${active ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"}`}>
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[13px] truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-muted truncate">{item.hint}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Officer / User Profile Footer */}
      <div className="mt-auto p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <OfficerChip />
      </div>
    </aside>
  );
}

function OfficerChip() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const roleLabel =
    user.role === "VICTIM"
      ? "Citizen Complainant"
      : user.role === "AUDITOR"
      ? "Judicial Evidence Auditor"
      : user.role === "EXCHANGE_NODAL_OFFICER"
      ? "Binance Compliance Lead"
      : user.is_gazetted
      ? "Gazetted Police Officer"
      : "Field Investigator";

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--chip)] border" style={{ borderColor: "var(--border)" }}>
      <div
        className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs shadow-sm"
        style={{
          background:
            user.role === "VICTIM"
              ? "linear-gradient(135deg, #06b6d4, #0891b2)"
              : user.is_gazetted
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#000"
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
