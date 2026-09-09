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
  const [certHash, setCertHash] = useState<string>("computing...");

  useEffect(() => {
    async function computeCertHash() {
      const enc = new TextEncoder();
      const input = `${selectedCase}:CryptoTrace-LEA-Cluster:BSA65B:${new Date().toISOString().split("T")[0]}`;
      const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
      setCertHash(
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
    }
    void computeCertHash();
  }, [selectedCase]);

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

1. CASE IDENTIFIER        : ${selectedCase}
2. INVESTIGATING UNIT     : Maharashtra State Cyber Police Station (BKC, Mumbai)
3. TARGET VASP / EXCHANGE : Binance International & WazirX India
4. FORENSIC ARTIFACT      : Multi-Hop Blockchain Money Flow & Sec 94 BNSS Order

A. SYSTEM & DEVICE PARTICULARS:
   Operating Platform  : CryptoTrace Forensic Cluster (Government Cloud Tier-II)
   SHA-256 Ledger Anchor: ${certHash}
   Verification Timestamp: ${new Date().toISOString()}
   Reviewing Officer   : ${user?.name || "Judicial Auditor (IN-JUDICIAL-00)"}
   Jurisdiction Code   : IN-JUDICIAL-00

B. STATUTORY CERTIFICATION:
   I, the undersigned, being the person responsible for the management and
   operation of the CryptoTrace Forensic Cluster used to produce the electronic
   records in Case ${selectedCase}, do hereby certify that:
   (a) The computer outputs (multi-chain blockchain graph attribution) were
       produced by the computer during a period when it was used in the
       ordinary course of the activities of Maharashtra Cyber Cell.
   (b) Throughout the material period, the computer was operating properly;
       or if not, any respect in which it was not operating properly or was
       out of operation for any part of that period did not affect the
       production of the document or the accuracy of its contents.
   (c) The information contained in the electronic record reproduces or is
       derived from such information supplied to the computer in the
       ordinary course of such activities.

C. ADMISSIBILITY ATTESTATION:
   This certificate is furnished in terms of Section 63 and Section 65B of
   the Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 65B, IEA 1872)
   and renders the attached electronic records admissible in evidence.

[SYSTEM CUSTODIAN CERTIFICATE — NOT A JUDICIAL ORDER]
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
        className="rounded border p-5 mb-6"
        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded border flex items-center justify-center text-xs font-bold font-mono"
              style={{ background: "var(--chip)", borderColor: "var(--border)", color: "var(--text-strong)" }}
            >
              65B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-strong)" }}>
                  Judicial Audit &amp; Evidence Verification Chamber
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-semibold" style={{ background: "var(--chip)", borderColor: "var(--border)", color: "var(--muted)" }}>
                  BSA SEC 65B READ-ONLY
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Session: <strong style={{ color: "var(--text-strong)" }}>{user?.name || "Judicial Auditor"}</strong> &bull; Judicial Auditor &bull; IN-JUDICIAL-00 &bull; Read-Only Evidence Integrity Mode
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded border" style={{ background: "var(--chip)", borderColor: "var(--border)", color: "var(--muted)" }}>
              Mutations Prohibited &mdash; ABAC Policy POL-02
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
                  className="w-full px-3 py-2 rounded text-xs border focus:outline-none"
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
                className="p-3 rounded border font-mono text-[10px] leading-relaxed max-h-[260px] overflow-y-auto"
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
                className="w-full py-2 rounded border text-xs font-semibold transition hover:opacity-80"
                style={{ background: "var(--chip)", borderColor: "var(--border)", color: "var(--text-strong)" }}
              >
                {certificateCopied ? "Certificate Copied to Clipboard" : "Copy Section 65B BSA Certificate"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
