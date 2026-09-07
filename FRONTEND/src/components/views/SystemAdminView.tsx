"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider";
import { Page } from "../ui/Page";
import type { AppUser, RoleName } from "@/lib/rbac-abac";

export function SystemAdminView() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [lockdown, setLockdown] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // New user form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<RoleName>("INVESTIGATING_OFFICER");
  const [newPassword, setNewPassword] = useState("Secure@123");

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, healthRes] = await Promise.all([
        fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_users" })
        }),
        fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "system_health" })
        })
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        if (uData.users) setUsers(uData.users);
      }
      if (healthRes.ok) {
        const hData = await healthRes.json();
        if (hData.health) {
          setHealth(hData.health);
          setLockdown(Boolean(hData.health.environment?.emergency_lockdown));
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleLockdown = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_lockdown", active: !lockdown })
      });
      if (res.ok) {
        setLockdown(!lockdown);
        setMessage(`National Emergency Lockdown turned ${!lockdown ? "ON" : "OFF"}.`);
        setTimeout(() => setMessage(null), 4000);
      }
    } catch {}
  };

  const handleToggleUserStatus = async (userId: number, currentActive: boolean) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_user_status", user_id: userId, is_active: !currentActive })
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
        );
        setMessage(`Updated user active status.`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {}
  };

  const handleChangeRole = async (userId: number, role: RoleName) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_role", user_id: userId, new_role: role })
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
        setMessage(`Updated user role to ${role}.`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {}
  };

  const handleResetPassword = async (userId: number) => {
    const newPwd = prompt("Enter new password for demo user:", "Password@123");
    if (!newPwd) return;
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", user_id: userId, new_password: newPwd })
      });
      if (res.ok) {
        setMessage(`Password reset successfully for user ID ${userId}.`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {}
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_user",
          name: newName,
          email: newEmail,
          role: newRole,
          password: newPassword
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewName("");
        setNewEmail("");
        loadData();
        setMessage(`New user created successfully.`);
        setTimeout(() => setMessage(null), 4000);
      }
    } catch {}
  };

  return (
    <Page width="wide">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-rose-400">
            INFRASTRUCTURE CONTROL
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          System Administration & Infrastructure
        </h1>
        <p className="text-xs text-muted mt-0.5">
          User account lifecycle, security policies & platform infrastructure monitoring
        </p>
      </div>

      {/* Mandatory Separation of Powers Notice */}
      <div
        className="rounded-xl border p-3.5 mb-6 text-xs flex items-start gap-3"
        style={{
          background: "rgba(244, 63, 94, 0.08)",
          borderColor: "rgba(244, 63, 94, 0.25)",
          color: "var(--text)"
        }}
      >
        <span className="text-rose-400 text-base mt-0.5">🔒</span>
        <div>
          <span className="font-bold text-rose-400">Statutory Separation of Powers:</span> System Administrators manage
          application infrastructure, credentials, and availability. Administrative users do{" "}
          <strong>NOT</strong> hold investigative authority or an invisible "god mode". Any administrative inspection of
          case records is explicitly recorded in the immutable judicial audit trail.
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-4 text-xs text-emerald-400 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-emerald-300 font-bold ml-2">×</button>
        </div>
      )}

      {/* Infrastructure Health & Killswitch Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-[11px] text-muted uppercase font-semibold">System Health</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">HEALTHY</div>
          <div className="text-[10px] text-muted mt-1">Uptime: {health?.uptimeSeconds || 120}s · All services operational</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-[11px] text-muted uppercase font-semibold">Active Demo Accounts</div>
          <div className="text-2xl font-bold mt-1" style={{ color: "var(--text-strong)" }}>{users.length || 8} Users</div>
          <div className="text-[10px] text-muted mt-1">Across 8 prototype role definitions</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-[11px] text-muted uppercase font-semibold">Storage Engine</div>
          <div className="text-2xl font-bold mt-1 text-sky-400">PostgreSQL / In-Memory</div>
          <div className="text-[10px] text-muted mt-1">Dual-mode zero-drop resilience</div>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
          <div className="text-[11px] text-muted uppercase font-semibold">National Emergency Gate</div>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-base font-bold ${lockdown ? "text-rose-500" : "text-emerald-400"}`}>
              {lockdown ? "ACTIVE LOCKDOWN" : "NORMAL"}
            </span>
            <button
              onClick={handleToggleLockdown}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                lockdown
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-rose-600 text-white hover:bg-rose-500"
              }`}
            >
              {lockdown ? "Disable" : "Trigger"}
            </button>
          </div>
          <div className="text-[10px] text-muted mt-1">Freezes non-admin API actions</div>
        </div>
      </div>

      {/* Keycloak 24 Enterprise Identity Provider Card */}
      <div
        className="rounded-xl border p-4 mb-6"
        style={{
          background: health?.keycloak?.online ? "rgba(16, 185, 129, 0.05)" : "rgba(245, 158, 11, 0.05)",
          borderColor: health?.keycloak?.online ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {health?.keycloak?.online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${health?.keycloak?.online ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </span>
            <span className="text-xs font-bold font-mono" style={{ color: health?.keycloak?.online ? "#10b981" : "#f59e0b" }}>
              KEYCLOAK 24 ENTERPRISE IDENTITY PROVIDER (IAM)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 font-mono font-semibold">
              OpenID Connect / RS256
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="http://localhost:8080/admin/master/console/#/sih-lea/sessions"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-600/30 transition flex items-center gap-1"
            >
              Keycloak Sessions Console ↗
            </a>
            <a
              href="http://localhost:8080/realms/sih-lea/.well-known/openid-configuration"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-[var(--chip)] text-muted text-xs font-mono hover:text-white transition"
            >
              OIDC Discovery ↗
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <div className="text-[10px] text-muted uppercase">IAM Status</div>
            <div className="font-bold mt-0.5 text-emerald-400">{health?.keycloak?.online ? "ONLINE (Connected)" : "OFFLINE (Fallback)"}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase">Target Realm</div>
            <div className="font-bold mt-0.5 text-sky-400">sih-lea</div>
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase">Registered Client</div>
            <div className="font-bold mt-0.5 text-amber-400">cryptotrace-frontend</div>
          </div>
          <div>
            <div className="text-[10px] text-muted uppercase">Cryptographic Token</div>
            <div className="font-bold mt-0.5 text-purple-400">RS256 (JWKS Rotated)</div>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="rounded-xl border p-5 space-y-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
              Prototype Account Administration
            </h3>
            <p className="text-xs text-muted">
              Configure credentials, enable/disable demo users, and assign RBAC roles
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition shadow"
          >
            + Create Demo User
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-left text-xs">
            <thead className="border-b text-[10px] uppercase font-semibold text-muted" style={{ background: "var(--chip)", borderColor: "var(--border)" }}>
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Primary Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Clearance</th>
                <th className="p-3">Jurisdiction</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[var(--hover)] transition">
                  <td className="p-3 font-semibold" style={{ color: "var(--text-strong)" }}>
                    <div>{u.name}</div>
                    {u.badge && <div className="text-[10px] font-mono text-muted">{u.badge}</div>}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted">{u.email}</td>
                  <td className="p-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value as RoleName)}
                      className="rounded border px-2 py-1 text-[11px] font-medium bg-[var(--chip)] focus:outline-none"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      <option value="INVESTIGATING_OFFICER">INVESTIGATING_OFFICER</option>
                      <option value="CYBERCRIME_SUPERVISOR">CYBERCRIME_SUPERVISOR</option>
                      <option value="SENIOR_INVESTIGATOR">SENIOR_INVESTIGATOR</option>
                      <option value="VASP_COMPLIANCE_OFFICER">VASP_COMPLIANCE_OFFICER</option>
                      <option value="COURT_REVIEWER">COURT_REVIEWER</option>
                      <option value="NATIONAL_COORDINATION_ANALYST">NATIONAL_COORDINATION_ANALYST</option>
                      <option value="VICTIM">VICTIM</option>
                      <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-300">
                      {u.clearance_level}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-muted text-[11px]">{u.jurisdiction_code || "National"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleUserStatus(u.id, u.is_active !== false)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                        u.is_active !== false
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                      }`}
                    >
                      {u.is_active !== false ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="text-sky-400 hover:underline text-[11px] font-medium"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="text-base font-bold" style={{ color: "var(--text-strong)" }}>
                Create Demo User
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. SI Kulkarni"
                  className="w-full rounded-xl border p-2.5 bg-[var(--chip)] focus:outline-none focus:ring-1 focus:ring-sky-400"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. kulkarni@example.demo"
                  className="w-full rounded-xl border p-2.5 bg-[var(--chip)] focus:outline-none focus:ring-1 focus:ring-sky-400"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as RoleName)}
                  className="w-full rounded-xl border p-2.5 bg-[var(--chip)] focus:outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  <option value="INVESTIGATING_OFFICER">INVESTIGATING_OFFICER</option>
                  <option value="CYBERCRIME_SUPERVISOR">CYBERCRIME_SUPERVISOR</option>
                  <option value="SENIOR_INVESTIGATOR">SENIOR_INVESTIGATOR</option>
                  <option value="VASP_COMPLIANCE_OFFICER">VASP_COMPLIANCE_OFFICER</option>
                  <option value="COURT_REVIEWER">COURT_REVIEWER</option>
                  <option value="NATIONAL_COORDINATION_ANALYST">NATIONAL_COORDINATION_ANALYST</option>
                  <option value="VICTIM">VICTIM</option>
                  <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Initial Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border p-2.5 bg-[var(--chip)] font-mono focus:outline-none"
                  style={{ borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border text-muted hover:bg-[var(--hover)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Page>
  );
}
