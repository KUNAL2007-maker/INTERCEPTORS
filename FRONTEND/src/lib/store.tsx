"use client";

/**
 * Trace Store for SIH26183 Crypto Fraud Attribution Platform
 * Backed by PostgreSQL REST API with resilient zero-config fallback.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { TraceResult, CaseMeta, WalletTransfer } from "@/lib/domain";
import {
  buildEvidence,
  section91Notice,
  type CryptoEvidence,
  type CryptoFinding,
  type LegalNotice,
  type TrackDecision,
} from "@/lib/investigation";
import { useAuth } from "@/components/AuthProvider";

// ── Types ────────────────────────────────────────────────────────────────────

export type TraceStatus = "idle" | "tracing" | "ready" | "error";
export type NoticeStatus = "Draft" | "Issued" | "Acknowledged";

/** A generated Section 94 BNSS notice plus the workflow state we track around it. */
export type StoredNotice = {
  id: string;
  status: NoticeStatus;
  createdAt: number;
  notice: LegalNotice;
};

type TraceStore = {
  // Core state
  trace: TraceResult | null;
  status: TraceStatus;
  error: string | null;
  traceNote: string | null;
  caseMeta: CaseMeta;
  history: TraceResult[];
  notices: StoredNotice[];

  // Derived engine outputs (memoised on `trace`)
  evidence: CryptoEvidence | null;
  track: TrackDecision | null;

  hydrating: boolean;
  persistent: boolean;
  refreshing: boolean;
  newTxHashes: string[];

  // Actions
  runTrace: (seed: string) => Promise<void>;
  loadDemo: () => Promise<void>;
  clearTrace: () => void;
  setCaseMeta: (patch: Partial<CaseMeta>) => void;
  generateNotice: (targetVaspName: string) => string | null;
  setNoticeStatus: (id: string, status: NoticeStatus) => void;
  removeNotice: (id: string) => void;
  refreshTrace: () => Promise<void>;
  ingestNcrpComplaint: (complaintData?: any) => Promise<void>;
};

// ── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<TraceStore | null>(null);

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await r.json()) as T;
}

export function TraceStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [status, setStatus] = useState<TraceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [traceNote, setTraceNote] = useState<string | null>(null);
  const [caseMeta, setCaseMetaState] = useState<CaseMeta>({
    ncrp_ack_no: "MH-CYBER-2026-0842",
    io_name: "Officer Sharma",
    victim_name: "Rajesh Verma",
    amount_lost_inr: 450000,
    jurisdiction_ps: "MH-CYBER-01"
  });
  const [history, setHistory] = useState<TraceResult[]>([]);
  const [notices, setNotices] = useState<StoredNotice[]>([]);
  const [hydrating, setHydrating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newTxHashes, setNewTxHashes] = useState<string[]>([]);

  // Derived engine outputs
  const evidence = useMemo(() => (trace ? buildEvidence(trace) : null), [trace]);
  const track = useMemo(() => evidence?.track ?? null, [evidence]);

  // Sync with PostgreSQL API on user change
  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      setHydrating(true);
      try {
        const [casesRes, noticesRes] = await Promise.all([
          fetch("/api/cases").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/notices").then((r) => (r.ok ? r.json() : null))
        ]);

        if (mounted && casesRes && casesRes.cases && casesRes.cases.length > 0) {
          const firstCase = casesRes.cases[0];
          setCaseMetaState((prev) => ({
            ...prev,
            ncrp_ack_no: firstCase.case_number,
            amount_lost_inr: Number(firstCase.loss_amount_inr) || prev.amount_lost_inr,
            jurisdiction_ps: firstCase.jurisdiction_code || prev.jurisdiction_ps
          }));
        }

        if (mounted && noticesRes && noticesRes.notices) {
          setNotices(noticesRes.notices);
        }
      } catch {
        // Fallback to local memory state
      } finally {
        if (mounted) setHydrating(false);
      }
    }

    hydrate();
    return () => {
      mounted = false;
    };
  }, [user?.role, user?.jurisdiction_code]);

  const runTrace = useCallback(async (seed: string) => {
    const s = seed.trim();
    if (!s) return;
    setStatus("tracing");
    setError(null);
    setTraceNote(null);

    try {
      const isDemo = s.toLowerCase() === "demo";
      const payload = isDemo ? { demo: true } : { seed: s };
      const res = await postJSON<any>("/api/trace", payload);

      if (!res || res.error || !res.nodes) {
        setStatus("error");
        setError(res?.error || "Trace request failed.");
        setTraceNote(res?.note || res?.hint || null);
        return;
      }

      const traceResult = (res.trace || res) as TraceResult;
      setTrace(traceResult);
      setHistory((prev) => [traceResult, ...prev.slice(0, 19)]);
      if (res.note) {
        setTraceNote(res.note);
      } else if (res.warnings && res.warnings.length > 0) {
        setTraceNote(res.warnings.join(" | "));
      }
      setStatus("ready");

      // Persist to PostgreSQL case table
      try {
        await postJSON("/api/cases", {
          case_number: `MH-${Date.now().toString().slice(-6)}`,
          suspect_wallet_address: isDemo ? (traceResult.seed || "0x24f3aeabd426f663385b80e89f85ec997e8f06f3") : s,
          blockchain_network: traceResult.seed_chain || "ETHEREUM",
          status: "TRACED"
        });
      } catch {
        // Non-blocking
      }
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Failed to reach tracing engine.");
    }
  }, []);

  const loadDemo = useCallback(async () => {
    return runTrace("demo");
  }, [runTrace]);

  const clearTrace = useCallback(() => {
    setTrace(null);
    setStatus("idle");
    setError(null);
    setTraceNote(null);
  }, []);

  const setCaseMeta = useCallback((patch: Partial<CaseMeta>) => {
    setCaseMetaState((prev) => ({ ...prev, ...patch }));
  }, []);

  const generateNotice = useCallback(
    (targetVaspName: string): string | null => {
      if (!evidence) return null;
      const notice = section91Notice(evidence, caseMeta, targetVaspName);
      const newNotice: StoredNotice = {
        id: `NOTICE-${Date.now()}`,
        status: "Issued",
        createdAt: Date.now(),
        notice
      };

      setNotices((prev) => [newNotice, ...prev]);

      // Save to PostgreSQL
      postJSON("/api/notices", {
        id: newNotice.id,
        target_vasp: targetVaspName,
        status: "Issued",
        drafted_by_name: user?.fullName || "Officer Sharma",
        notice
      }).catch(() => {});

      return newNotice.id;
    },
    [evidence, caseMeta, user]
  );

  const setNoticeStatus = useCallback((id: string, newStatus: NoticeStatus) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: newStatus } : n))
    );
  }, []);

  const removeNotice = useCallback((id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const refreshTrace = useCallback(async () => {
    if (!trace?.seed) return;
    setRefreshing(true);
    try {
      const res = await postJSON<any>("/api/trace", {
        seed: trace.seed,
        chain: trace.seed_chain,
      });
      const traceResult = (res?.trace || (res?.nodes ? res : null)) as TraceResult | null;
      if (traceResult && traceResult.transfers) {
        const oldHashes = new Set(trace.transfers.map((t) => t.tx_hash));
        const newlyDiscovered = traceResult.transfers
          .map((t) => t.tx_hash)
          .filter((h) => !oldHashes.has(h));
        setNewTxHashes(newlyDiscovered);
        setTrace(traceResult);
      }
    } catch (err) {
      console.error("Refresh trace failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [trace]);

  const ingestNcrpComplaint = useCallback(
    async (complaintData?: any) => {
      const payload = complaintData || {
        complaint_id: `NCRP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        portal: "NCRP_1930_CFCFRMS",
        victim_phone: "+91-98765-43210",
        suspect_wallet: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        crime_category: "Task-based Investment Scam",
        loss_amount_inr: 450000,
        blockchain_network: "Ethereum"
      };

      try {
        const res = await postJSON<any>("/api/ingest/ncrp", payload);
        if (res.success && res.case) {
          setCaseMetaState({
            ncrp_ack_no: res.case.case_number,
            io_name: user?.fullName || "Officer Sharma",
            victim_name: "Rajesh Verma",
            amount_lost_inr: Number(res.case.loss_amount_inr) || 450000,
            jurisdiction_ps: res.case.jurisdiction_code || "MH-CYBER-01"
          });
          // Automatically run trace on suspect wallet for law enforcement roles
          if (user?.role !== "VICTIM" && user?.role !== "EXCHANGE_NODAL_OFFICER") {
            await runTrace(res.case.suspect_wallet_address);
          }
        }
      } catch {
        // Local demo fallback for law enforcement
        if (user?.role !== "VICTIM" && user?.role !== "EXCHANGE_NODAL_OFFICER") {
          await runTrace("demo");
        }
      }
    },
    [user, runTrace]
  );

  return (
    <Ctx.Provider
      value={{
        trace,
        status,
        error,
        traceNote,
        caseMeta,
        history,
        notices,
        evidence,
        track,
        hydrating,
        persistent: true,
        refreshing,
        newTxHashes,
        runTrace,
        loadDemo,
        clearTrace,
        setCaseMeta,
        generateNotice,
        setNoticeStatus,
        removeNotice,
        refreshTrace,
        ingestNcrpComplaint
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTraceStore(): TraceStore {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTraceStore must be used within TraceStoreProvider");
  return c;
}

export function useNotices(): { notices: StoredNotice[] } {
  const { notices } = useTraceStore();
  return { notices };
}

export function useTransfers(): {
  transfers: WalletTransfer[];
  loading: boolean;
  newTxHashes: string[];
} {
  const { trace, status, hydrating, newTxHashes } = useTraceStore();
  return {
    transfers: trace?.transfers ?? [],
    loading: status === "tracing" || hydrating,
    newTxHashes,
  };
}

export function useFindings(): { findings: CryptoFinding[] } {
  const { evidence } = useTraceStore();
  return { findings: evidence?.findings ?? [] };
}

export function useTraceStats(): {
  wallets: number;
  highRisk: number;
  tracedUsd: number;
  openFindings: number;
} {
  const { evidence } = useTraceStore();
  return {
    wallets: evidence?.walletCount ?? 0,
    highRisk: evidence?.bySeverity.high ?? 0,
    tracedUsd: evidence?.totalUsd ?? 0,
    openFindings: evidence?.findings.length ?? 0,
  };
}

export function useTraceHistory(): { traces: TraceResult[] } {
  const { history } = useTraceStore();
  return { traces: history };
}


