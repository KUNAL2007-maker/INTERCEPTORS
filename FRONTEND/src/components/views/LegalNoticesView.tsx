"use client";

/**
 * Section 91 CrPC / Section 94 BNSS freeze-and-produce requisition manager.
 *
 * Three things happen on this screen, and the boundary between them is the point:
 *
 *   1. Any authorised investigator DRAFTS a requisition against a live trace.
 *      A draft is not an order. It carries no signature and no legal weight.
 *   2. A GAZETTED officer ISSUES it. That single action is where the server
 *      applies an Ed25519 signature over the canonical order payload, and it is
 *      the only place a signature ever comes into being. A non-gazetted officer
 *      sees the button, sees why it is closed to them, and can send the draft up.
 *   3. Anyone looking at an issued order can VERIFY it - the signature block is
 *      recomputed server-side from the stored order, so verification catches an
 *      order that was edited after signing, not merely one signed with the wrong
 *      key.
 *
 * What this screen deliberately cannot do: mark an order Acknowledged. That
 * transition belongs to the exchange it was served on and is recorded through
 * the compliance desk. The previous version of this file let any police user
 * click a tab and set it, which wrote "the exchange has replied" into the record
 * when no exchange had.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Page } from "@/components/ui/Page";
import { useNotices, useTraceStore, type NoticeStatus, type StoredNotice } from "@/lib/store";
import { useAuth } from "@/components/AuthProvider";
import { normalizeRole } from "@/lib/rbac-abac";
import { formatUSD, formatINR, shortWallet, CHAINS, chainColor } from "@/lib/domain";
import { ensureLegalNotice } from "@/lib/investigation";

// ── Status pill ──────────────────────────────────────────────────────────────
const PILL: Record<NoticeStatus, { text: string; bg: string; border: string }> = {
  Draft: { text: "text-slate-300", bg: "bg-white/[0.04]", border: "border-white/15" },
  Issued: { text: "text-amber-200", bg: "bg-amber-500/[0.08]", border: "border-amber-500/25" },
  Acknowledged: { text: "text-emerald-200", bg: "bg-emerald-500/[0.08]", border: "border-emerald-500/25" },
};

const STATUS_LABEL: Record<NoticeStatus, string> = {
  Draft: "Draft — unsigned",
  Issued: "Issued & signed",
  Acknowledged: "Acknowledged by exchange",
};

function StatusPill({ status, size = "sm" }: { status: NoticeStatus; size?: "sm" | "md" }) {
  const m = (status && PILL[status]) || PILL.Draft;
  const pad = size === "md" ? "px-2.5 py-1 text-[11.5px]" : "px-2 py-0.5 text-[10.5px]";
  return (
    <span
      className={`inline-flex items-center rounded border ${m.border} ${m.bg} ${m.text} ${pad} font-medium uppercase tracking-wider`}
    >
      {STATUS_LABEL[status] || STATUS_LABEL.Draft}
    </span>
  );
}

function whenLabel(ts?: number | null): string {
  if (!ts || isNaN(Number(ts))) return "—";
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Verification = {
  valid: boolean;
  reason: string;
  computed_hash?: string;
  recorded_hash?: string;
  checks: { label: string; passed: boolean; detail?: string }[];
};

export function LegalNoticesView({ onGoToTrace }: { onGoToTrace: () => void }) {
  const { user } = useAuth();
  const { notices } = useNotices();
  const { evidence, generateNotice, issueNotice, refreshNotices, removeNotice } = useTraceStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // normalizeRole, not a bare string compare. The canonical role is
  // VASP_COMPLIANCE_OFFICER; EXCHANGE_NODAL_OFFICER is a legacy alias, and
  // checking only the alias let the canonical role through every gate below.
  const normRole = normalizeRole(user?.role || "");
  const isExchange = normRole === "VASP_COMPLIANCE_OFFICER";
  const isCourt = normRole === "COURT_REVIEWER";
  const readOnly = isExchange || isCourt;

  const selected = notices.find((n) => n.id === selectedId) ?? notices[0] ?? null;

  // Serviceable freeze targets: every attributed exchange that is not a mixer.
  const serviceable = evidence?.vasps.filter((v) => !v.is_mixer) ?? [];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleGenerate(vaspName: string) {
    const id = generateNotice(vaspName);
    if (id) {
      setSelectedId(id);
      setPicking(false);
      setToast({ kind: "ok", text: `Drafted a Section 94 BNSS requisition to ${vaspName}. It is unsigned until a gazetted officer issues it.` });
    }
  }

  async function handleIssue(id: string) {
    const res = await issueNotice(id);
    setToast(
      res.success
        ? { kind: "ok", text: "Order issued and digitally signed. The addressed exchange can now verify it." }
        : { kind: "err", text: res.error || "The order was not issued." },
    );
  }

  function handleDelete(id: string) {
    removeNotice(id);
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <Page width="wide">
      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4">
          <div className="rounded border" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10.5px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                    Statutory requisitions
                  </div>
                  <div className="mt-0.5 text-[15px] font-semibold" style={{ color: "var(--text-strong)" }}>
                    {notices.length} on record
                  </div>
                </div>
                {!readOnly ? (
                  <button
                    onClick={() => setPicking((p) => !p)}
                    disabled={!evidence}
                    className="rounded border px-2.5 py-1.5 text-[11px] font-medium transition hover:bg-[var(--hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
                  >
                    {picking ? "Cancel" : "Draft new"}
                  </button>
                ) : (
                  <span
                    className="rounded border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                  >
                    {isCourt ? "Read only" : "Inbound desk"}
                  </span>
                )}
              </div>

              {!evidence && !readOnly && (
                <div className="mt-2 text-[11px]" style={{ color: "var(--muted-2)" }}>
                  Trace a wallet first — a requisition can only name addresses the trace supports.
                </div>
              )}

              {picking && evidence && (
                <div className="mt-3 rounded border p-2" style={{ borderColor: "var(--border)", background: "var(--panel-2)" }}>
                  <div className="px-1 pb-1.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--muted-2)" }}>
                    Serve on a serviceable exchange
                  </div>
                  {serviceable.length === 0 ? (
                    <div className="px-1 pb-1 text-[11.5px]" style={{ color: "var(--muted)" }}>
                      No serviceable exchange endpoint in this trace
                      {evidence.mixersTouched.length
                        ? ` — funds ended in ${evidence.mixersTouched.join(", ")}, which has no compliance desk on which process can be served`
                        : ""}
                      .
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {serviceable.map((v) => (
                        <button
                          key={v.vasp_name}
                          onClick={() => handleGenerate(v.vasp_name)}
                          className="flex w-full items-center justify-between gap-2 rounded px-2.5 py-2 text-left transition hover:bg-[var(--hover)]"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-medium" style={{ color: "var(--text-strong)" }}>
                              {v.vasp_name}
                            </span>
                            <span className="block text-[10.5px]" style={{ color: "var(--muted)" }}>
                              {v.is_verified ? "Verified exchange" : "Offshore / unverified"} · {v.confidence}% confidence
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[11.5px]" style={{ color: "var(--muted)" }}>
                            {formatUSD(v.inflowUsd)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {toast && (
                <div
                  className="mt-3 rounded border px-2.5 py-2 text-[11px] leading-relaxed"
                  role="status"
                  style={
                    toast.kind === "ok"
                      ? { borderColor: "rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.07)", color: "#bae6fd" }
                      : { borderColor: "rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.07)", color: "#fca5a5" }
                  }
                >
                  {toast.text}
                </div>
              )}
            </div>

            <div className="max-h-[560px] divide-y overflow-auto" style={{ borderColor: "var(--border)" }}>
              {notices.map((item) => {
                const active = item.id === (selected?.id ?? "");
                const ref = item.notice?.ref || item.case_number || item.id;
                const isServiceable = item.notice?.serviceable ?? true;
                const vaspName = item.notice?.to_vasp || item.target_vasp || "Attributed exchange";

                return (
                  <div key={item.id} className="group relative">
                    <button
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full p-3 pr-9 text-left transition hover:bg-[var(--hover)] ${
                        active ? "border-l-2 border-sky-400 bg-white/[0.03]" : "border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <StatusPill status={item.status} />
                      </div>
                      <div className="mt-1.5 font-mono text-[10.5px] truncate" style={{ color: "var(--muted-2)" }}>
                        {ref}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[12.5px]" style={{ color: "var(--text-strong)" }}>
                        {isServiceable ? `Freeze & KYC production — ${vaspName}` : `No serviceable endpoint — ${vaspName}`}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10.5px]" style={{ color: "var(--muted)" }}>
                        <span className="font-mono">{item.case_number || "no case"}</span>
                        <span>·</span>
                        <span>{whenLabel(item.createdAt)}</span>
                        {item.signature && (
                          <>
                            <span>·</span>
                            <span className="font-mono">key {item.signature.key_id.slice(0, 8)}</span>
                          </>
                        )}
                      </div>
                    </button>
                    {/* Drafts only. An issued order is a statutory record and is
                        not removable from a list on a screen. */}
                    {!readOnly && item.status === "Draft" && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        aria-label="Discard this draft"
                        title="Discard this draft"
                        className="absolute right-2 top-2.5 rounded px-1.5 py-0.5 text-[13px] leading-none opacity-0 transition hover:bg-red-500/20 hover:text-red-200 focus:opacity-100 group-hover:opacity-100"
                        style={{ color: "var(--muted-2)" }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              {notices.length === 0 && (
                <div className="p-6 text-center text-[12px]" style={{ color: "var(--muted)" }}>
                  {readOnly
                    ? "No requisitions on record for you to review."
                    : evidence
                    ? "No requisitions yet. Use “Draft new” to raise one against this trace."
                    : "No requisitions yet. Trace a wallet first."}
                </div>
              )}
            </div>
          </div>

          {evidence && (
            <div
              className="rounded border p-4 text-[11.5px] leading-relaxed"
              style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <div className="mb-1.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--muted-2)" }}>
                Source of the wording
              </div>
              Every requisition here is drafted from the current trace of{" "}
              <span className="font-mono" style={{ color: "var(--text)" }}>
                {shortWallet(evidence.seed)}
              </span>{" "}
              — <span style={{ color: "var(--text)" }}>{evidence.txCount}</span> transfers,{" "}
              <span style={{ color: "var(--text)" }}>{formatUSD(evidence.totalUsd)}</span> moved. Re-trace and the
              addresses and amounts follow. Once an order is signed its content is fixed: editing the trace afterwards
              does not silently change a signed order, it makes verification fail.
            </div>
          )}
        </aside>

        <section className="min-w-0">
          {!selected && (
            <div
              className="flex h-full min-h-[420px] flex-col items-center justify-center rounded border p-10 text-center"
              style={{ background: "var(--panel)", borderColor: "var(--border)" }}
            >
              {evidence ? (
                <>
                  <div className="text-[14px] font-semibold" style={{ color: "var(--text-strong)" }}>
                    No requisition drafted yet
                  </div>
                  <div className="mt-1.5 max-w-md text-[12px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                    {serviceable.length
                      ? `Draft a Section 91 CrPC / Section 94 BNSS freeze-and-produce requisition to one of the ${serviceable.length} serviceable exchange${
                          serviceable.length === 1 ? "" : "s"
                        } this trace reached.`
                      : "This trace reached no serviceable exchange endpoint. Extend the trace or await further hops before a requisition can be drafted."}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[14px] font-semibold" style={{ color: "var(--text-strong)" }}>
                    No trace loaded
                  </div>
                  <div className="mt-1.5 max-w-md text-[12px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
                    Trace the wallet named in the complaint first. A requisition drafted without a trace would assert
                    facts nothing supports.
                  </div>
                  <button
                    onClick={onGoToTrace}
                    className="mt-4 rounded border px-4 py-2 text-[12px] font-medium transition hover:bg-[var(--hover)]"
                    style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
                  >
                    Go to wallet trace
                  </button>
                </>
              )}
            </div>
          )}

          {selected && (
            <NoticeDocument
              key={selected.id}
              stored={selected}
              readOnly={readOnly}
              onIssue={() => handleIssue(selected.id)}
              onRefresh={() => void refreshNotices()}
            />
          )}
        </section>
      </div>
    </Page>
  );
}

// ── The document panel, its signature block, and the print portal ────────────
function NoticeDocument({
  stored,
  readOnly,
  onIssue,
  onRefresh,
}: {
  stored: StoredNotice;
  readOnly: boolean;
  onIssue: () => Promise<void>;
  onRefresh: () => void;
}) {
  const n = useMemo(() => ensureLegalNotice(stored?.notice, stored), [stored]);
  const { canApproveFreeze, user } = useAuth();
  const copyRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [verification, setVerification] = useState<Verification | "loading" | null>(null);
  useEffect(() => setMounted(true), []);

  const sig = stored.signature;
  const resp = stored.vasp_response;
  const isGazetted = Boolean(user?.is_gazetted) && canApproveFreeze;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(renderWithSignature(n, sig));
      if (copyRef.current) {
        const el = copyRef.current;
        const prev = el.textContent;
        el.textContent = "Copied";
        setTimeout(() => {
          el.textContent = prev;
        }, 1400);
      }
    } catch {
      /* clipboard blocked — the text is on screen to copy by hand */
    }
  };

  const download = () => {
    const blob = new Blob([renderWithSignature(n, sig)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(n.ref || stored?.id || "requisition").replace(/[^\w.-]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const verify = async () => {
    setVerification("loading");
    try {
      const res = await fetch(`/api/notices/verify?id=${encodeURIComponent(stored.id)}`);
      const data = await res.json();
      if (!res.ok) {
        setVerification({ valid: false, reason: data?.error || "Verification failed.", checks: [] });
        return;
      }
      setVerification(data.verification);
    } catch {
      setVerification({ valid: false, reason: "Could not reach the verification service.", checks: [] });
    }
  };

  const issue = async () => {
    setIssuing(true);
    try {
      await onIssue();
    } finally {
      setIssuing(false);
    }
  };

  return (
    <>
      <div className="rounded border" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
        <div className="flex items-start gap-4 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10.5px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                {n.statute || "Section 91 CrPC / Section 94 BNSS"}
              </span>
              <StatusPill status={stored?.status || "Draft"} size="md" />
            </div>
            <div className="mt-1.5 text-[16px] font-semibold" style={{ color: "var(--text-strong)" }}>
              {n.serviceable
                ? `Freeze & KYC production — ${n.to_vasp}`
                : `No serviceable endpoint — ${n.to_vasp}`}
            </div>
            <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--muted)" }}>
              Ref <span className="font-mono">{n.ref || stored?.case_number || stored?.id}</span>
              {stored.case_number ? ` · case ${stored.case_number}` : ""}
              {n.serviceable && n.to_email ? ` · to ${n.to_email}` : ""}
              {n.amountInr ? ` · loss ${formatINR(n.amountInr)}` : ""}
            </div>
            {n.date && (
              <div className="mt-0.5 text-[11px]" style={{ color: "var(--muted-2)" }}>
                Dated {n.date}
                {n.jurisdiction && n.jurisdiction !== "n/a" ? ` · ${n.jurisdiction}` : ""}
                {stored.drafted_by_name ? ` · drafted by ${stored.drafted_by_name}` : ""}
              </div>
            )}
          </div>
          <button
            onClick={() => window.print()}
            className="shrink-0 rounded border px-3 py-1.5 text-[11.5px] font-medium transition hover:bg-[var(--hover)]"
            style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
          >
            Print / save as PDF
          </button>
        </div>

        <div className="space-y-5 p-5">
          {!n.serviceable && (
            <div
              className="rounded border p-3 text-[12px] leading-relaxed"
              style={{ borderColor: "rgba(252,211,77,0.3)", background: "rgba(252,211,77,0.06)", color: "var(--text)" }}
            >
              The traced funds terminate in an endpoint with no compliance desk on which process can be served. No
              Section 91 / 94 requisition can issue until an attributable exchange is identified — refer the exposure to
              FIU-IND and reconstruct the flow first.
            </div>
          )}

          <Section title="1 · Requisition">
            {(n.body || []).map((p, i) => (
              <p key={i} className={i ? "mt-2" : ""} style={{ whiteSpace: "pre-wrap" }}>
                {p}
              </p>
            ))}
          </Section>

          {(n.walletTrail || []).length > 0 && (
            <Section title="2 · Traced deposit trail">
              <div className="overflow-hidden rounded border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-[12px]">
                  <thead className="text-left" style={{ background: "var(--chip)", color: "var(--muted)" }}>
                    <tr>
                      <th className="px-3 py-2 font-medium">Hop</th>
                      <th className="px-3 py-2 font-medium">From → To</th>
                      <th className="px-3 py-2 font-medium">Chain</th>
                      <th className="px-3 py-2 font-medium">Token</th>
                      <th className="px-3 py-2 text-right font-medium">Value</th>
                      <th className="px-3 py-2 font-medium">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(n.walletTrail || []).filter(Boolean).map((h, i) => (
                      <tr
                        key={`${h?.hop ?? i}-${h?.tx_hash ?? i}`}
                        className="border-t"
                        style={{ borderColor: "var(--border)", color: "var(--text)" }}
                      >
                        <td className="px-3 py-2 font-mono">{h?.hop ?? i + 1}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono">
                          {shortWallet(h?.from)} → {shortWallet(h?.to)}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="h-2 w-2 rounded-full" style={{ background: chainColor(h?.chain) }} />
                            {CHAINS[h?.chain]?.short ?? h?.chain ?? "UNKNOWN"}
                          </span>
                        </td>
                        <td className="px-3 py-2">{h?.token || "USDT"}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatUSD(h?.valueUsd)}</td>
                        <td className="px-3 py-2 font-mono">{shortWallet(h?.tx_hash)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {(n.kycDemands || []).length > 0 && (
            <Section title="3 · KYC production demanded">
              <ol className="list-decimal space-y-1.5 pl-5">
                {(n.kycDemands || []).filter(Boolean).map((d, i) => (
                  <li key={i}>{String(d)}</li>
                ))}
              </ol>
            </Section>
          )}

          {n.freezeRequest && (
            <Section title="4 · Directive">
              <div className="rounded border p-3" style={{ borderColor: "var(--border)", background: "var(--chip)" }}>
                {n.freezeRequest}
              </div>
            </Section>
          )}

          {(n.targetAddresses || []).length > 0 && (
            <Section title="5 · Accounts named">
              <div className="flex flex-wrap gap-1.5">
                {(n.targetAddresses || []).filter(Boolean).map((a, i) => (
                  <span
                    key={`${a}-${i}`}
                    className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                    style={{ background: "var(--chip)", color: "var(--muted)" }}
                  >
                    {shortWallet(a)}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* ── Signature block ─────────────────────────────────────────────── */}
          <SignatureBlock
            stored={stored}
            verification={verification}
            onVerify={verify}
            onRefresh={onRefresh}
          />

          {/* ── Issue gate ──────────────────────────────────────────────────── */}
          {!readOnly && stored.status === "Draft" && (
            <IssueGate
              isGazetted={isGazetted}
              serviceable={n.serviceable}
              userName={user?.name}
              userRole={user?.role}
              issuing={issuing}
              onIssue={issue}
            />
          )}

          {/* ── What the exchange said back ─────────────────────────────────── */}
          {resp && <ExchangeReply resp={resp} />}

          {stored.status === "Issued" && !resp?.acknowledged_at && (
            <div className="text-[11px]" style={{ color: "var(--muted-2)" }}>
              Served and awaiting the exchange&rsquo;s acknowledgement. The reply is recorded by the exchange&rsquo;s
              nodal officer, not here.
            </div>
          )}

          {/* Export */}
          <div className="flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
            <button
              ref={copyRef}
              onClick={copy}
              className="rounded border px-3 py-1.5 text-[11.5px] transition hover:bg-[var(--hover)]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Copy text
            </button>
            <button
              onClick={download}
              className="rounded border px-3 py-1.5 text-[11.5px] transition hover:bg-[var(--hover)]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              Download .txt
            </button>
            {n.serviceable && n.to_email && stored.status !== "Draft" && (
              <a
                href={`mailto:${n.to_email}?subject=${encodeURIComponent(n.subject || "Section 94 BNSS Requisition")}&body=${encodeURIComponent(renderWithSignature(n, sig).slice(0, 1500))}`}
                className="rounded border px-3 py-1.5 text-[11.5px] transition hover:bg-[var(--hover)]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Draft covering email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Print target — globals.css shows only #sar-print-portal when printing. */}
      {mounted &&
        createPortal(
          <div id="sar-print-portal">
            <h1>REQUISITION UNDER {n.statute || "SECTION 91 CrPC / SECTION 94 BNSS"}</h1>
            {(n.body || []).map((para, i) => (
              <p key={i} style={{ whiteSpace: "pre-wrap" }}>
                {para}
              </p>
            ))}
            {sig && (
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "11px", marginTop: "18px" }}>{signatureFooter(sig)}</pre>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Signature block ─────────────────────────────────────────────────────────
function SignatureBlock({
  stored,
  verification,
  onVerify,
  onRefresh,
}: {
  stored: StoredNotice;
  verification: Verification | "loading" | null;
  onVerify: () => void;
  onRefresh: () => void;
}) {
  const sig = stored.signature;

  if (!sig) {
    return (
      <Section title="6 · Digital signature">
        <div
          className="rounded border p-3 text-[11.5px] leading-relaxed"
          style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--muted)" }}
        >
          Unsigned. This document is a draft and carries no statutory authority. A signature is applied at the moment a
          gazetted officer issues the order, and cannot be added to it afterwards.
        </div>
      </Section>
    );
  }

  return (
    <Section title="6 · Digital signature">
      <div className="rounded border" style={{ borderColor: "var(--border)", background: "var(--chip)" }}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 p-3.5 sm:grid-cols-2">
          <Meta label="Signed by">
            <span style={{ color: "var(--text-strong)" }}>{sig.officer.name}</span>
            <span className="block text-[10.5px]" style={{ color: "var(--muted)" }}>
              {sig.officer.designation}
              {sig.officer.badge ? ` · badge ${sig.officer.badge}` : ""}
            </span>
          </Meta>
          <Meta label="Signed at">
            <span style={{ color: "var(--text-strong)" }}>{new Date(sig.signed_at).toLocaleString("en-IN")}</span>
          </Meta>
          <Meta label="Algorithm">
            <span className="font-mono" style={{ color: "var(--text-strong)" }}>
              {sig.algorithm} · {sig.digest}
            </span>
          </Meta>
          <Meta label="Signing key">
            <span className="font-mono" style={{ color: "var(--text-strong)" }}>
              {sig.key_id}
            </span>
          </Meta>
          <div className="sm:col-span-2">
            <Meta label="Canonical payload hash">
              <code className="block break-all font-mono text-[10.5px]" style={{ color: "var(--text)" }}>
                {sig.payload_hash}
              </code>
            </Meta>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-2 border-t px-3.5 py-2.5"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-[10.5px]" style={{ color: "var(--muted-2)" }}>
            Verification recomputes the order&rsquo;s canonical form on the server. An order altered after signing fails
            it.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              className="rounded border px-2.5 py-1 text-[11px] transition hover:bg-[var(--hover)]"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              Reload from server
            </button>
            <button
              onClick={onVerify}
              className="rounded border px-3 py-1 text-[11px] font-medium transition hover:bg-[var(--hover)]"
              style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
            >
              {verification === "loading" ? "Verifying…" : "Verify signature"}
            </button>
          </div>
        </div>

        {verification && verification !== "loading" && (
          <div
            className="border-t p-3.5"
            style={{
              borderColor: "var(--border)",
              background: verification.valid ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)",
            }}
          >
            <div className="text-[11.5px] font-semibold" style={{ color: verification.valid ? "#6ee7b7" : "#fca5a5" }}>
              {verification.valid ? "Signature verified" : "Signature not verified"}
            </div>
            <div className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {verification.reason}
            </div>
            {verification.checks.length > 0 && (
              <ul className="mt-2.5 space-y-1">
                {verification.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-[10.5px]">
                    <span
                      className="w-[34px] shrink-0 font-mono font-semibold"
                      style={{ color: c.passed ? "#6ee7b7" : "#fca5a5" }}
                    >
                      {c.passed ? "PASS" : "FAIL"}
                    </span>
                    <span style={{ color: "var(--muted)" }}>
                      {c.label}
                      {c.detail ? ` — ${c.detail}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {verification.computed_hash && verification.recorded_hash &&
              verification.computed_hash !== verification.recorded_hash && (
                <div className="mt-2.5 space-y-1 text-[10px]" style={{ color: "#fca5a5" }}>
                  <div>
                    Recorded at signing: <code className="font-mono">{verification.recorded_hash}</code>
                  </div>
                  <div>
                    Recomputed now: <code className="font-mono">{verification.computed_hash}</code>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </Section>
  );
}

// ── The Section 94 gazetted gate ────────────────────────────────────────────
function IssueGate({
  isGazetted,
  serviceable,
  userName,
  userRole,
  issuing,
  onIssue,
}: {
  isGazetted: boolean;
  serviceable: boolean;
  userName?: string;
  userRole?: string;
  issuing: boolean;
  onIssue: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  if (!isGazetted) {
    return (
      <div
        className="rounded border p-3.5"
        style={{ borderColor: "rgba(252,211,77,0.3)", background: "rgba(252,211,77,0.05)" }}
      >
        <div className="text-[11.5px] font-semibold" style={{ color: "#fcd34d" }}>
          Section 94 BNSS gate — signing authority not held
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Under Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (formerly Section 91 CrPC), a requisition
          restraining assets held by a reporting entity must be signed by a gazetted police officer of the rank of ACP
          or DSP and above. {userName || "This account"}
          {userRole ? ` (${userRole})` : ""} is not gazetted, so the platform will not sign on their behalf.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
          The draft is already on record against this case and visible to every gazetted officer in your unit. There is
          nothing further to send: it is signed from their own screen, under their own key, which is the whole point of
          the gate.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded border p-3.5"
      style={{ borderColor: "rgba(56,189,248,0.3)", background: "rgba(56,189,248,0.05)" }}
    >
      <div className="text-[11.5px] font-semibold" style={{ color: "#7dd3fc" }}>
        Section 94 BNSS signing authority — {userName}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: "var(--muted)" }}>
        Issuing signs this order with your Ed25519 key over its canonical form: the case, the accounts named, the sum,
        the statute, the addressed exchange, and the time. The signature is recorded against your identity and is
        checkable by the exchange and by the court. It cannot be withdrawn — a later change is a fresh order, not an
        edit to this one.
      </p>
      {!serviceable && (
        <p className="mt-2 text-[11px]" style={{ color: "#fcd34d" }}>
          This trace names no serviceable exchange. An order issued now has no compliance desk to serve.
        </p>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-[11px]" style={{ color: "var(--text)" }}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I have read this order in full and I authorise it under Section 94 BNSS, 2023 in my capacity as a gazetted
          officer.
        </span>
      </label>
      <button
        onClick={onIssue}
        disabled={!confirmed || issuing}
        className="mt-3 rounded border px-3.5 py-2 text-[12px] font-semibold transition hover:bg-[var(--hover)] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ borderColor: "rgba(56,189,248,0.45)", background: "rgba(56,189,248,0.1)", color: "#e0f2fe" }}
      >
        {issuing ? "Signing…" : "Sign and issue under Section 94 BNSS"}
      </button>
    </div>
  );
}

// ── What the exchange reported back ─────────────────────────────────────────
function ExchangeReply({
  resp,
}: {
  resp: NonNullable<StoredNotice["vasp_response"]>;
}) {
  const label =
    resp.action === "FREEZE_EXECUTED"
      ? "Freeze executed"
      : resp.action === "PARTIAL_FREEZE"
      ? "Partial freeze"
      : resp.action === "REFUSED"
      ? "Refused"
      : "Acknowledged, action pending";

  const tone =
    resp.action === "REFUSED" ? "#fca5a5" : resp.action === "PARTIAL_FREEZE" ? "#fcd34d" : resp.action ? "#6ee7b7" : "#7dd3fc";

  return (
    <Section title="7 · Exchange response">
      <div className="rounded border p-3.5" style={{ borderColor: "var(--border)", background: "var(--chip)" }}>
        <div className="text-[11.5px] font-semibold" style={{ color: tone }}>
          {label}
        </div>
        <div className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {resp.acknowledged_at && (
            <Meta label="Receipt acknowledged">
              <span style={{ color: "var(--text-strong)" }}>
                {new Date(resp.acknowledged_at).toLocaleString("en-IN")}
              </span>
              <span className="block text-[10.5px]" style={{ color: "var(--muted)" }}>
                {resp.acknowledged_by || "—"}
                {typeof resp.ack_latency_minutes === "number" ? ` · ${resp.ack_latency_minutes} min after issue` : ""}
              </span>
            </Meta>
          )}
          {resp.action_reported_at && (
            <Meta label="Action reported">
              <span style={{ color: "var(--text-strong)" }}>
                {new Date(resp.action_reported_at).toLocaleString("en-IN")}
              </span>
              {resp.executed_by && (
                <span className="block text-[10.5px]" style={{ color: "var(--muted)" }}>
                  by {resp.executed_by}
                </span>
              )}
            </Meta>
          )}
          {resp.exchange_ref_no && (
            <Meta label="Exchange reference">
              <span className="font-mono" style={{ color: "var(--text-strong)" }}>
                {resp.exchange_ref_no}
              </span>
            </Meta>
          )}
          {resp.frozen_amount && (
            <Meta label="Sum restrained">
              <span style={{ color: "var(--text-strong)" }}>{resp.frozen_amount}</span>
            </Meta>
          )}
          {resp.reason && (
            <div className="sm:col-span-2">
              <Meta label={resp.action === "REFUSED" ? "Reason for refusal" : "Reason stated"}>
                <span style={{ color: "var(--text)" }}>{resp.reason}</span>
              </Meta>
            </div>
          )}
        </div>
        <p className="mt-3 text-[10.5px] leading-relaxed" style={{ color: "var(--muted-2)" }}>
          Reported by the exchange on its own systems. The platform records the reply; it does not itself restrain
          anything, and no entry here is an on-chain action.
        </p>
      </div>
    </Section>
  );
}

// ── Plain-text signature footer, shared by copy, download and print ─────────
function signatureFooter(sig: NonNullable<StoredNotice["signature"]>): string {
  return [
    "",
    "----------------------------------------------------------------------",
    "DIGITAL SIGNATURE (Section 94 BNSS, 2023)",
    "----------------------------------------------------------------------",
    `Signed by      : ${sig.officer.name}`,
    `Designation    : ${sig.officer.designation}`,
    ...(sig.officer.badge ? [`Badge          : ${sig.officer.badge}`] : []),
    `Signed at      : ${new Date(sig.signed_at).toISOString()}`,
    `Algorithm      : ${sig.algorithm} over a ${sig.digest} digest of the canonical order`,
    `Key identifier : ${sig.key_id}`,
    `Payload hash   : ${sig.payload_hash}`,
    `Nonce          : ${sig.nonce}`,
    `Signature      : ${sig.signature}`,
    `Public key     : ${sig.public_key}`,
    "",
    "The signature above covers the case number, the accounts named, the sum,",
    "the statute, the addressed reporting entity, the signing officer and the",
    "time of signing. It can be verified independently against the public key.",
    "----------------------------------------------------------------------",
  ].join("\n");
}

function renderWithSignature(n: { rendered?: string; body?: string[] }, sig?: StoredNotice["signature"]): string {
  const base = n.rendered || (n.body || []).join("\n\n");
  return sig ? `${base}\n${signatureFooter(sig)}` : base;
}

// ── Small pieces ────────────────────────────────────────────────────────────
function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] font-medium uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
        {label}
      </div>
      <div className="mt-0.5 text-[11.5px]">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        {title}
      </div>
      <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--text)" }}>
        {children}
      </div>
    </section>
  );
}
