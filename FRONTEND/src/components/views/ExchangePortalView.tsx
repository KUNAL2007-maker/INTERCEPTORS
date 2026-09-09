"use client";

/**
 * The exchange nodal officer's desk.
 *
 * What this screen is, and what it is not. In an actual Section 94 BNSS
 * service, the order reaches the exchange's nodal officer through their legal
 * channel; the exchange's own compliance team restrains the account on the
 * exchange's own systems, and then replies. No police platform reaches into an
 * exchange's ledger, and nothing anywhere touches the blockchain - a custodial
 * balance is a database row at the exchange.
 *
 * So this desk records a reply in two stages, which is the shape of the real
 * process:
 *
 *   1. Acknowledge receipt - the exchange confirms it holds the order. This
 *      starts the clock the exchange is answerable against, and is the entry
 *      the investigator cites when service is disputed.
 *   2. Report action taken - freeze executed, partial, or refused. A refusal is
 *      a first-class outcome with a mandatory reason, because refusals happen
 *      (wrong exchange, account already emptied, no such deposit) and a
 *      platform that can only record success produces evidence that is wrong.
 *
 * Before either stage, the desk verifies the gazetted officer's Ed25519
 * signature. An exchange should not act on an instrument it cannot check.
 */

import { useState, useEffect, useCallback } from "react";
import { Page, Card, PanelHeader } from "../ui/Page";
import { useAuth } from "../AuthProvider";
import { formatINR, shortWallet } from "@/lib/domain";

type VaspResponse = {
  acknowledged_at?: string;
  acknowledged_by?: string;
  ack_latency_minutes?: number;
  action?: "FREEZE_EXECUTED" | "PARTIAL_FREEZE" | "REFUSED";
  action_reported_at?: string;
  executed_by?: string;
  exchange_ref_no?: string;
  frozen_amount?: string;
  reason?: string;
};

type Notice = {
  id: string;
  case_number?: string;
  target_vasp: string;
  vasp_id?: number;
  status: "Draft" | "Issued" | "Acknowledged";
  drafted_by_name?: string;
  approved_by_name?: string;
  created_at: number;
  notice?: any;
  signature?: any;
  vasp_response?: VaspResponse;
};

type Verification = {
  valid: boolean;
  reason: string;
  computed_hash?: string;
  recorded_hash?: string;
  checks: { label: string; passed: boolean; detail?: string }[];
};

export function ExchangePortalView() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<Record<string, Verification | "loading">>({});
  const [openForm, setOpenForm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notices");
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Could not load the requisition queue.");
        setNotices([]);
        return;
      }
      setNotices(Array.isArray(data?.notices) ? data.notices : []);
    } catch {
      setError("Could not reach the platform. The requisition queue is not shown rather than shown stale.");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const verify = useCallback(async (noticeId: string) => {
    setVerifications((prev) => ({ ...prev, [noticeId]: "loading" }));
    try {
      const res = await fetch(`/api/notices/verify?id=${encodeURIComponent(noticeId)}`);
      const data = await res.json();
      if (!res.ok) {
        setVerifications((prev) => ({
          ...prev,
          [noticeId]: { valid: false, reason: data?.error || "Verification failed.", checks: [] },
        }));
        return;
      }
      setVerifications((prev) => ({ ...prev, [noticeId]: data.verification }));
    } catch {
      setVerifications((prev) => ({
        ...prev,
        [noticeId]: { valid: false, reason: "Could not reach the verification service.", checks: [] },
      }));
    }
  }, []);

  const acknowledge = useCallback(
    async (noticeId: string) => {
      setError(null);
      try {
        const res = await fetch("/api/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: noticeId, action: "acknowledge", acknowledged_by: user?.name }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Acknowledgement was not recorded.");
          return;
        }
        await load();
      } catch {
        setError("Could not reach the platform. Nothing was recorded.");
      }
    },
    [load, user?.name],
  );

  const reportAction = useCallback(
    async (noticeId: string, payload: Record<string, unknown>) => {
      setError(null);
      try {
        const res = await fetch("/api/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: noticeId, action: "report_action", ...payload }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "The report was not recorded.");
          return false;
        }
        setOpenForm(null);
        await load();
        return true;
      } catch {
        setError("Could not reach the platform. Nothing was recorded.");
        return false;
      }
    },
    [load],
  );

  const pendingAck = notices.filter((n) => n.status !== "Draft" && !n.vasp_response?.acknowledged_at).length;
  const pendingAction = notices.filter((n) => n.vasp_response?.acknowledged_at && !n.vasp_response?.action).length;
  const closed = notices.filter((n) => n.vasp_response?.action).length;

  return (
    <Page width="wide">
      <div className="mb-5 rounded border p-4" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
        <PanelHeader
          eyebrow="Section 94 BNSS · Inbound Requisitions"
          title="Exchange Nodal Compliance Desk"
          right={
            <button
              onClick={() => void load()}
              className="rounded border px-3 py-1.5 text-[11px] font-medium text-muted transition hover:text-white"
              style={{ borderColor: "var(--border)" }}
            >
              Refresh
            </button>
          }
        />
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          {user?.name}
          {user?.vasp_name ? ` · ${user.vasp_name}` : ""} · FIU-IND registered reporting entity. Only requisitions
          addressed to this organisation are shown.
        </p>
        {/* Stated plainly, because a demo that implies otherwise is misleading. */}
        <p
          className="mt-3 rounded border px-3 py-2 text-[11px] leading-relaxed"
          style={{ borderColor: "var(--border)", background: "var(--surface-sunken)", color: "var(--muted)" }}
        >
          This desk records your organisation&rsquo;s reply to a served order. It does not freeze anything. The restraint
          is applied by your compliance team on your own systems, and no action here touches the blockchain.
        </p>
      </div>

      {error && (
        <div
          className="mb-5 rounded border px-3 py-2 text-[12px]"
          style={{ borderColor: "rgba(248,113,113,0.4)", background: "rgba(248,113,113,0.08)", color: "#fca5a5" }}
        >
          {error}
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Awaiting acknowledgement" value={String(pendingAck)} hint="Receipt not yet confirmed" />
        <Stat label="Acknowledged, action pending" value={String(pendingAction)} hint="Clock running" />
        <Stat label="Replied" value={String(closed)} hint="Outcome reported to police" />
      </div>

      {loading ? (
        <Card>
          <div className="py-8 text-center text-[12px] text-muted">Loading the requisition queue…</div>
        </Card>
      ) : notices.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <div className="text-[13px] font-medium" style={{ color: "var(--text-strong)" }}>
              No requisitions addressed to this exchange.
            </div>
            <div className="mt-1 text-[11px] text-muted">
              Orders appear here once a gazetted officer issues and signs one naming this organisation.
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <NoticeRow
              key={n.id}
              notice={n}
              verification={verifications[n.id]}
              onVerify={() => void verify(n.id)}
              onAcknowledge={() => void acknowledge(n.id)}
              formOpen={openForm === n.id}
              onToggleForm={() => setOpenForm(openForm === n.id ? null : n.id)}
              onReport={(payload) => reportAction(n.id, payload)}
            />
          ))}
        </div>
      )}
    </Page>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded border p-3" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold" style={{ color: "var(--text-strong)" }}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-2">{hint}</div>
    </div>
  );
}

function NoticeRow({
  notice,
  verification,
  onVerify,
  onAcknowledge,
  formOpen,
  onToggleForm,
  onReport,
}: {
  notice: Notice;
  verification?: Verification | "loading";
  onVerify: () => void;
  onAcknowledge: () => void;
  formOpen: boolean;
  onToggleForm: () => void;
  onReport: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const resp = notice.vasp_response;
  const ref = notice.notice?.ref || notice.id;
  const wallets: string[] = Array.isArray(notice.notice?.targetAddresses) ? notice.notice.targetAddresses : [];
  const amountInr = Number(notice.notice?.amountInr ?? 0);

  const stage: "unacknowledged" | "acknowledged" | "reported" = resp?.action
    ? "reported"
    : resp?.acknowledged_at
    ? "acknowledged"
    : "unacknowledged";

  return (
    <div className="rounded border" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
      <div
        className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="min-w-0">
          <div className="font-mono text-[12px] font-semibold" style={{ color: "var(--text-strong)" }}>
            {ref}
          </div>
          <div className="mt-0.5 text-[11px] text-muted">
            Case {notice.case_number || "—"} · issued {new Date(notice.created_at).toLocaleString("en-IN")}
            {notice.approved_by_name ? ` · signed by ${notice.approved_by_name}` : ""}
          </div>
        </div>
        <StageBadge stage={stage} action={resp?.action} />
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-3 text-[11px] md:grid-cols-2">
        <Field label="Accounts named in the order">
          {wallets.length > 0 ? (
            <div className="space-y-1">
              {wallets.map((w) => (
                <code key={w} className="block break-all font-mono text-[11px] text-cyan-300">
                  {w}
                </code>
              ))}
            </div>
          ) : (
            <span className="text-muted">Not stated in the order</span>
          )}
        </Field>
        <Field label="Sum specified">
          <span style={{ color: "var(--text-strong)" }}>{amountInr > 0 ? `${formatINR(amountInr)} INR` : "—"}</span>
        </Field>
        <Field label="Statute">
          <span className="text-muted">{notice.notice?.statute || "Section 94 BNSS, 2023"}</span>
        </Field>
        <Field label="Directive">
          <span className="text-muted">
            {notice.notice?.freezeRequest ||
              "Restrain withdrawal, transfer and P2P trading on the named accounts and preserve KYC and login records."}
          </span>
        </Field>
      </div>

      {/* Signature check. Before, not after, acting on the order. */}
      <div className="border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-muted">
            {notice.signature ? (
              <>
                Signed {notice.signature.algorithm} · key {notice.signature.key_id}
              </>
            ) : (
              <>This order carries no digital signature.</>
            )}
          </div>
          <button
            onClick={onVerify}
            className="rounded border px-3 py-1.5 text-[11px] font-medium transition hover:bg-[var(--hover)]"
            style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
          >
            {verification === "loading" ? "Verifying…" : "Verify signature"}
          </button>
        </div>

        {verification && verification !== "loading" && (
          <div
            className="mt-3 rounded border p-3"
            style={{
              borderColor: verification.valid ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)",
              background: verification.valid ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)",
            }}
          >
            <div
              className="text-[11px] font-semibold"
              style={{ color: verification.valid ? "#6ee7b7" : "#fca5a5" }}
            >
              {verification.valid ? "Signature verified" : "Signature not verified"}
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-muted">{verification.reason}</div>
            {verification.checks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {verification.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-[10.5px]">
                    <span style={{ color: c.passed ? "#6ee7b7" : "#fca5a5" }}>{c.passed ? "PASS" : "FAIL"}</span>
                    <span className="text-muted">
                      {c.label}
                      {c.detail ? ` — ${c.detail}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Stage 1 / stage 2 / outcome */}
      <div className="border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
        {stage === "unacknowledged" && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onAcknowledge}
              className="rounded border px-3.5 py-2 text-[12px] font-semibold transition hover:bg-[var(--hover)]"
              style={{ borderColor: "rgba(56,189,248,0.4)", background: "rgba(56,189,248,0.1)", color: "#e0f2fe" }}
            >
              Acknowledge receipt of requisition
            </button>
            <span className="text-[10.5px] text-muted">
              Confirms your organisation holds this order and starts the response clock. It is not a statement that
              you have acted.
            </span>
          </div>
        )}

        {stage === "acknowledged" && (
          <div className="space-y-3">
            <div className="text-[11px] text-muted">
              Receipt acknowledged by {resp?.acknowledged_by} on{" "}
              {resp?.acknowledged_at ? new Date(resp.acknowledged_at).toLocaleString("en-IN") : "—"}
              {typeof resp?.ack_latency_minutes === "number" ? ` · ${resp.ack_latency_minutes} min after issue` : ""}.
            </div>
            {!formOpen ? (
              <button
                onClick={onToggleForm}
                className="rounded border px-3.5 py-2 text-[12px] font-semibold transition hover:bg-[var(--hover)]"
                style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
              >
                Report action taken on our systems
              </button>
            ) : (
              <ActionForm onCancel={onToggleForm} onSubmit={onReport} />
            )}
          </div>
        )}

        {stage === "reported" && resp && <Outcome resp={resp} />}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-2">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function StageBadge({
  stage,
  action,
}: {
  stage: "unacknowledged" | "acknowledged" | "reported";
  action?: VaspResponse["action"];
}) {
  const map: Record<string, { text: string; color: string; border: string }> = {
    unacknowledged: { text: "Awaiting acknowledgement", color: "#fcd34d", border: "rgba(252,211,77,0.35)" },
    acknowledged: { text: "Acknowledged · action pending", color: "#7dd3fc", border: "rgba(125,211,252,0.35)" },
    FREEZE_EXECUTED: { text: "Freeze executed", color: "#6ee7b7", border: "rgba(110,231,183,0.35)" },
    PARTIAL_FREEZE: { text: "Partial freeze", color: "#fcd34d", border: "rgba(252,211,77,0.35)" },
    REFUSED: { text: "Refused", color: "#fca5a5", border: "rgba(252,165,165,0.35)" },
  };
  const key = stage === "reported" && action ? action : stage;
  const s = map[key] || map.unacknowledged;
  return (
    <span
      className="rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ borderColor: s.border, color: s.color }}
    >
      {s.text}
    </span>
  );
}

function Outcome({ resp }: { resp: VaspResponse }) {
  return (
    <div className="space-y-2 text-[11px]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Action reported">
          <span style={{ color: "var(--text-strong)" }}>
            {resp.action === "FREEZE_EXECUTED"
              ? "Freeze executed"
              : resp.action === "PARTIAL_FREEZE"
              ? "Partial freeze"
              : "Refused"}
          </span>
        </Field>
        <Field label="Exchange reference">
          <code className="font-mono text-[11px] text-cyan-300">{resp.exchange_ref_no}</code>
        </Field>
        <Field label="Executed by">
          <span style={{ color: "var(--text-strong)" }}>{resp.executed_by}</span>
        </Field>
        <Field label="Reported at">
          <span className="text-muted">
            {resp.action_reported_at ? new Date(resp.action_reported_at).toLocaleString("en-IN") : "—"}
          </span>
        </Field>
        {resp.frozen_amount && (
          <Field label="Amount restrained">
            <span style={{ color: "var(--text-strong)" }}>{resp.frozen_amount}</span>
          </Field>
        )}
      </div>
      {resp.reason && (
        <div className="rounded border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-sunken)" }}>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-2">Reason stated</div>
          <div className="mt-1 leading-relaxed text-muted">{resp.reason}</div>
        </div>
      )}
      <div className="text-[10.5px] text-muted-2">
        This reply is now on the case record and visible to the issuing officer and the court.
      </div>
    </div>
  );
}

function ActionForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [action, setAction] = useState<"FREEZE_EXECUTED" | "PARTIAL_FREEZE" | "REFUSED">("FREEZE_EXECUTED");
  const [refNo, setRefNo] = useState("");
  const [executedBy, setExecutedBy] = useState("");
  const [frozenAmount, setFrozenAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // A reason is required for anything short of a full freeze, matched to the
  // server-side rule so the officer is told before submitting rather than after.
  const reasonRequired = action !== "FREEZE_EXECUTED";
  const complete = refNo.trim() && executedBy.trim() && (!reasonRequired || reason.trim());

  return (
    <div className="rounded border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-sunken)" }}>
      <div className="text-[11px] font-semibold" style={{ color: "var(--text-strong)" }}>
        Report what your compliance team did
      </div>

      <div className="mt-3 space-y-2">
        {(
          [
            ["FREEZE_EXECUTED", "Freeze executed", "The named accounts are fully restrained on our systems."],
            ["PARTIAL_FREEZE", "Partial freeze", "Only part of the sum was available to restrain."],
            ["REFUSED", "Refused", "We did not act. A reason is required."],
          ] as const
        ).map(([val, label, hint]) => (
          <label key={val} className="flex cursor-pointer items-start gap-2.5">
            <input
              type="radio"
              name="vasp-action"
              checked={action === val}
              onChange={() => setAction(val)}
              className="mt-0.5"
            />
            <span className="min-w-0">
              <span className="block text-[11.5px] font-medium" style={{ color: "var(--text-strong)" }}>
                {label}
              </span>
              <span className="block text-[10.5px] text-muted">{hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Exchange reference no." value={refNo} onChange={setRefNo} placeholder="e.g. BIN-CMP-2026-4471" />
        <Input label="Executed by" value={executedBy} onChange={setExecutedBy} placeholder="Name and designation" />
        {action !== "REFUSED" && (
          <Input
            label="Amount restrained (optional)"
            value={frozenAmount}
            onChange={setFrozenAmount}
            placeholder="e.g. 12,400 USDT"
          />
        )}
      </div>

      <div className="mt-3">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-2">
          {reasonRequired ? "Reason (required)" : "Remarks (optional)"}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={
            action === "REFUSED"
              ? "e.g. No account on our platform holds the deposit address named in the order."
              : action === "PARTIAL_FREEZE"
              ? "e.g. 4,100 of 12,400 USDT remained at the time of service; the balance had been withdrawn."
              : "Any remarks for the issuing officer."
          }
          className="mt-1 w-full rounded border bg-transparent px-2.5 py-2 text-[11.5px] outline-none"
          style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button
          disabled={!complete || busy}
          onClick={async () => {
            setBusy(true);
            const ok = await onSubmit({
              action_taken: action,
              action,
              exchange_ref_no: refNo,
              executed_by: executedBy,
              frozen_amount: frozenAmount || undefined,
              reason: reason || undefined,
            });
            if (!ok) setBusy(false);
          }}
          className="rounded border px-3.5 py-2 text-[12px] font-semibold transition disabled:opacity-40"
          style={{ borderColor: "rgba(56,189,248,0.4)", background: "rgba(56,189,248,0.1)", color: "#e0f2fe" }}
        >
          {busy ? "Recording…" : "Submit reply to issuing officer"}
        </button>
        <button
          onClick={onCancel}
          className="rounded border px-3 py-2 text-[12px] text-muted transition hover:text-white"
          style={{ borderColor: "var(--border)" }}
        >
          Cancel
        </button>
        {!complete && (
          <span className="text-[10.5px] text-muted-2">
            Reference number and the name of the person who acted are required
            {reasonRequired ? ", along with a reason" : ""}.
          </span>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-2">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded border bg-transparent px-2.5 py-1.5 text-[11.5px] outline-none"
        style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
      />
    </label>
  );
}
