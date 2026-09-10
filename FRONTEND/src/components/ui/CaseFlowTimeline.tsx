"use client";

import type { StoredCase } from "@/lib/db";
import { shortWallet } from "@/lib/domain";

/**
 * Read-only statutory recovery timeline for a single case.
 *
 * Pure function of the case's status + a handful of scalar fields — it reads
 * neither the trace store nor the auth context, so it is safe to reuse from the
 * victim portal (self-service tracking) and the supervisor desk (read-only
 * "where has the case reached" view) alike.
 */
export function CaseFlowTimeline({ c }: { c: StoredCase }) {
  const status = c.status;
  const traced =
    status === "TRACED" ||
    status === "AWAITING_SIGNATURE" ||
    status === "NOTICE_SERVED" ||
    status === "FROZEN" ||
    status === "FREEZE_REFUSED";
  const noticeServed =
    status === "NOTICE_SERVED" || status === "FROZEN" || status === "FREEZE_REFUSED";
  const settled = status === "FROZEN" || status === "FREEZE_REFUSED";

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 mt-2">
      {/* Step 1: Ingestion */}
      <TimelineStep
        stepNum={1}
        isDone={true}
        isActive={false}
        title="1. Fraud Incident Ingested via NCRP Gateway"
        description={`Registered with Ack No. ${c.case_number}. Suspect wallet recorded in police database.`}
        timestamp={`${c.incident_date || "17 Aug 2026"} · Ingestion Confirmed`}
      />

      {/* Step 2: Police Assigned & Money Flow Mapped */}
      <TimelineStep
        stepNum={2}
        isDone={status !== "PENDING_TRACING"}
        isActive={status === "PENDING_TRACING"}
        title="2. Automated Multi-Hop Blockchain Tracing"
        description={
          status === "PENDING_TRACING"
            ? "Assigned to Maharashtra Cyber Unit. Investigating Officer initiating forensic money flow tracing on suspect wallet."
            : `Suspect wallet ${shortWallet(c.suspect_wallet_address)} traced across hops. Laundering path unmasked.`
        }
        timestamp={status === "PENDING_TRACING" ? "Under Police Investigation" : "Attribution Complete"}
      />

      {/* Step 3: VASP Attribution */}
      <TimelineStep
        stepNum={3}
        isDone={traced}
        isActive={status === "PENDING_TRACING"}
        title="3. Exchange / VASP Attribution Unmasked"
        description={
          status === "PENDING_TRACING"
            ? "Tracing algorithm actively locating deposit endpoints at FIU-IND registered crypto exchanges."
            : `Laundered funds identified at ${c.target_vasp || "Binance International"} deposit wallet.`
        }
        timestamp={status === "PENDING_TRACING" ? "Pending Trace Results" : "Attribution Verified"}
      />

      {/* Step 4: Section 94 BNSS Freeze Notice */}
      <TimelineStep
        stepNum={4}
        isDone={noticeServed}
        isActive={status === "TRACED" || status === "AWAITING_SIGNATURE"}
        title="4. Statutory Section 94 BNSS Freezing Order Served"
        description={
          noticeServed
            ? `Digitally signed by Gazetted Police Officer under Section 94 BNSS / 91 CrPC and served directly to ${c.target_vasp || "Binance"} Compliance.`
            : status === "TRACED" || status === "AWAITING_SIGNATURE"
            ? "Money flow verified. Gazetted Police Officer preparing statutory Section 94 BNSS requisition."
            : "Requires completion of money flow trace."
        }
        timestamp={
          noticeServed
            ? "Statutory Notice Served"
            : status === "TRACED" || status === "AWAITING_SIGNATURE"
            ? "Drafting Freezing Order"
            : "Pending Prior Step"
        }
      />

      {/* Step 5: Exchange Asset Freezing */}
      <TimelineStep
        stepNum={5}
        isDone={settled}
        isActive={status === "NOTICE_SERVED"}
        isRefused={status === "FREEZE_REFUSED"}
        title="5. Exchange Asset Freezing & Escrow"
        description={
          status === "FROZEN"
            ? `${c.target_vasp || "Binance"} Nodal Officer confirmed asset lock. Cryptocurrency balance held in escrow under police directive.`
            : status === "FREEZE_REFUSED"
            ? `${c.target_vasp || "The exchange"} Compliance reported inability to execute freeze. Refusal report forwarded to Investigating Officer for review.`
            : status === "NOTICE_SERVED"
            ? "Exchange Compliance Nodal Desk processing freezing directive under 45-minute statutory SLA."
            : "Awaiting legal notice delivery to exchange compliance desk."
        }
        timestamp={
          status === "FROZEN"
            ? "Assets Locked in Escrow"
            : status === "FREEZE_REFUSED"
            ? "Freeze Refused by Exchange"
            : status === "NOTICE_SERVED"
            ? "Under Exchange Compliance Review"
            : "Pending"
        }
      />

      {/* Step 6: Judicial Restitution */}
      <TimelineStep
        stepNum={6}
        isDone={false}
        isActive={false}
        title="6. Judicial Restitution & Fund Return to Bank Account"
        description="Application under Section 503 BNSS (formerly Sec 451/457 CrPC) before Metropolitan Magistrate Court for judicial release of frozen cryptocurrency back to complainant."
        timestamp="Pending Court Order"
      />
    </div>
  );
}

function TimelineStep({
  stepNum,
  isDone,
  isActive,
  isRefused,
  title,
  description,
  timestamp,
}: {
  stepNum: number;
  isDone: boolean;
  isActive: boolean;
  isRefused?: boolean;
  title: string;
  description: string;
  timestamp: string;
}) {
  const dotClass = isRefused
    ? "bg-red-500 text-white"
    : isDone
    ? "bg-emerald-500 text-black"
    : isActive
    ? "bg-amber-400 text-black"
    : "bg-slate-700 text-slate-400";

  const titleClass = isRefused
    ? "text-red-400"
    : isDone
    ? "text-white"
    : isActive
    ? "text-amber-300"
    : "text-slate-400";

  const tsClass = isRefused
    ? "text-red-500"
    : isDone
    ? "text-muted"
    : isActive
    ? "text-amber-400"
    : "text-slate-500";

  return (
    <div className="relative">
      <span
        className={`absolute -left-[27px] top-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-[#0d1117] ${dotClass}`}
      >
        {isDone ? stepNum : isActive ? "●" : stepNum}
      </span>
      <div className={`text-xs font-bold ${titleClass}`}>{title}</div>
      <div className="text-[11px] text-muted mt-0.5">{description}</div>
      <span className={`text-[10px] font-mono ${tsClass}`}>{timestamp}</span>
    </div>
  );
}
