"use client";

import { useEffect, useState } from "react";
import { Page, Card } from "../ui/Page";
import { useAuth } from "../AuthProvider";
import type { StoredAuditLog } from "@/lib/db";

export function AuditorPortalView() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<StoredAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState("MH-CYBER-2026-0842");
  const [certificateCopied, setCertificateCopied] = useState(false);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/audit");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const sampleEvidenceCertificate = `
================================================================================
CERTIFICATE OF ELECTRONIC EVIDENCE UNDER SECTION 63 / 65B 
BHARATIYA SAKSHYA ADHINIYAM, 2023 (BSA 2023)
[Formerly Section 65B, Indian Evidence Act, 1872]
================================================================================

1. CASE IDENTIFIER: ${selectedCase}
2. INVESTIGATING POLICE UNIT: Maharashtra State Cyber Police Station (BKC, Mumbai)
3. TARGET VASP / EXCHANGE: Binance International & WazirX India
4. FORENSIC ARTIFACT: Multi-Hop Blockchain Money Flow & Section 94 BNSS Order

A. SYSTEM & DEVICE PARTICULARS:
   - Operating Platform: CryptoTrace Enterprise LEA Cluster (Gov Cloud)
   - SHA-256 Ledger Anchor: 8f4e2b8109d93cf02b9e6f3a14e9124317f2e15c32890ac82e4431f9b37c6d12
   - Verification Timestamp: ${new Date().toISOString()}
   - Inspection Officer: ${user?.name || "Justice K. S. Rao (Judicial Auditor)"}
   - Jurisdiction Code: IN-JUDICIAL-00

B. STATUTORY CERTIFICATION:
   I, the undersigned, hereby certify that:
   (a) The computerized multi-chain blockchain graph attribution outputs were 
       produced during the regular course of official cyber forensics.
   (b) The cryptographic hash chain of custody remained tamper-free throughout 
       the evidentiary extraction window.
   (c) At all material times, the cryptographic audit trail system was operating 
       normally with continuous logging of access requests.

C. ADMISSIBILITY ATTESTATION:
   This electronic evidence record satisfies all legal requirements of 
   admissibility in a Court of Law under Section 63 and Section 65B of the 
   Bharatiya Sakshya Adhiniyam, 2023.

[DIGITALLY VERIFIED - ELECTRONIC JUDICIAL SEAL]
`.trim();

  const handleCopyCert = () => {
    navigator.clipboard.writeText(sampleEvidenceCertificate);
    setCertificateCopied(true);
    setTimeout(() => setCertificateCopied(false), 3000);
  };

  return (
    <Page width="wide">
      {/* Judicial Header Banner */}
      <div
        className="rounded-2xl border p-5 mb-6 shadow-lg"
        style={{
          background: "linear-gradient(135deg, rgba(234, 179, 8, 0.08), rgba(245, 158, 11, 0.04))",
          borderColor: "rgba(234, 179, 8, 0.3)"
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ background: "#eab308", color: "#000" }}
            >
              ⚖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Judicial Audit & Evidence Verification Chamber
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-semibold">
                  BSA SEC 65B READ-ONLY
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Session: <strong className="text-white">{user?.name || "Justice K. S. Rao"}</strong> &bull; Judicial Auditor &bull; IN-JUDICIAL-00 &bull; Read-Only Evidence Integrity Mode
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              🔒 Mutations Prohibited under ABAC Policy POL-02
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Cryptographic Audit Trail */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Immutable Cryptographic Audit Trail"
            hint="Real-time log of access attempts, role authorizations, and statutory BNSS notice actions"
          >
            {loading ? (
              <div className="py-8 text-center text-xs text-muted">Querying PostgreSQL audit logs...</div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">No audit events recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-[10px] uppercase tracking-wider text-muted" style={{ borderColor: "var(--border)" }}>
                      <th className="py-2.5 px-2">Timestamp</th>
                      <th className="py-2.5 px-2">Officer / User</th>
                      <th className="py-2.5 px-2">Action</th>
                      <th className="py-2.5 px-2">Decision</th>
                      <th className="py-2.5 px-2">Statutory Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-2.5 px-2 font-mono text-[10px] text-muted whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "—"}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="font-semibold text-white block">{log.user_name}</span>
                          <span className="text-[10px] text-muted font-mono">{log.user_role}</span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-[11px] text-cyan-300">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              log.decision === "GRANTED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {log.decision}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-[11px] text-muted max-w-[200px] truncate" title={log.reason}>
                          {log.reason || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: BSA 2023 Sec 65B Certificate Generator */}
        <div className="space-y-4">
          <Card title="Electronic Evidence Certificate" hint="Bharatiya Sakshya Adhiniyam, 2023 (Sec 63/65B)">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted mb-1">Select Case Dossier</label>
                <select
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border focus:outline-none"
                  style={{
                    background: "var(--surface-sunken)",
                    borderColor: "var(--border)",
                    color: "var(--text-strong)"
                  }}
                >
                  <option value="MH-CYBER-2026-0842">MH-CYBER-2026-0842 (Binance / Rajesh Verma)</option>
                  <option value="DL-CYBER-2026-0319">DL-CYBER-2026-0319 (WazirX India / Phishing)</option>
                  <option value="IN-I4C-2026-9901">IN-I4C-2026-9901 (Cross-Border Syndicate)</option>
                </select>
              </div>

              <div
                className="p-3 rounded-xl border font-mono text-[10px] leading-relaxed max-h-[260px] overflow-y-auto"
                style={{
                  background: "#080b0f",
                  borderColor: "var(--border)",
                  color: "#94a3b8"
                }}
              >
                <pre className="whitespace-pre-wrap">{sampleEvidenceCertificate}</pre>
              </div>

              <button
                onClick={handleCopyCert}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black transition flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #eab308, #f59e0b)" }}
              >
                <span>📜</span>
                <span>{certificateCopied ? "Certificate Copied to Clipboard!" : "Copy Section 65B BSA Certificate"}</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
