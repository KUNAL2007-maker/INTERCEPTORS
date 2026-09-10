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
  ensureLegalNotice,
  normalizeStoredNotice,
  type CryptoEvidence,
  type CryptoFinding,
  type LegalNotice,
  type NoticeSignature,
  type NoticeVaspResponse,
  type TrackDecision,
} from "@/lib/investigation";
import type { StoredCase } from "@/lib/db";
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
  case_number?: string;
  target_vasp?: string;
  vasp_id?: number;
  drafted_by_name?: string;
  approved_by_name?: string;
  /**
   * Server-applied Ed25519 signature. Read-only on the client - it arrives with
   * the notice or it does not exist, and its absence is what "unsigned" means.
   */
  signature?: NoticeSignature;
  /** The addressed exchange's acknowledgement and reported action, if any. */
  vasp_response?: NoticeVaspResponse;
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
  cases: StoredCase[];
  activeCase: StoredCase | null;

  // Derived engine outputs (memoised on `trace`)
  evidence: CryptoEvidence | null;
  track: TrackDecision | null;

  hydrating: boolean;
  persistent: boolean;
  refreshing: boolean;
  newTxHashes: string[];

  // Actions. runTrace resolves to the freshly-built TraceResult so a caller can
  // use it in the same turn (e.g. the chat re-tracing the selected case before
  // sending it as context) without waiting for the store's async state update.
  runTrace: (seed: string, linkedCase?: StoredCase) => Promise<TraceResult | null>;
  loadDemo: () => Promise<void>;
  clearTrace: () => void;
  setCaseMeta: (patch: Partial<CaseMeta>) => void;
  setActiveCase: (c: StoredCase | null) => void;
  loadCases: () => Promise<StoredCase[]>;
  generateNotice: (targetVaspName: string, targetCaseNumber?: string) => string | null;
  issueNotice: (id: string) => Promise<{ success: boolean; error?: string }>;
  refreshNotices: () => Promise<void>;
  removeNotice: (id: string) => void;
  refreshTrace: () => Promise<void>;
  ingestNcrpComplaint: (complaintData?: any) => Promise<any>;
  withdrawComplaint: (caseNumber: string) => Promise<{ success: boolean; error?: string }>;
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
  const [cases, setCases] = useState<StoredCase[]>([]);
  const [activeCase, setActiveCase] = useState<StoredCase | null>(null);
  const [history, setHistory] = useState<TraceResult[]>([]);
  const [notices, setNotices] = useState<StoredNotice[]>([]);
  const [hydrating, setHydrating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newTxHashes, setNewTxHashes] = useState<string[]>([]);

  // Derived engine outputs
  const evidence = useMemo(() => (trace ? buildEvidence(trace) : null), [trace]);
  const track = useMemo(() => evidence?.track ?? null, [evidence]);

  const loadCases = useCallback(async (): Promise<StoredCase[]> => {
    try {
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.cases)) {
          setCases(data.cases);
          setActiveCase((prev) => {
            if (!prev) return data.cases.length > 0 ? data.cases[0] : null;
            return data.cases.find((c: StoredCase) => c.case_number === prev.case_number) || (data.cases.length > 0 ? data.cases[0] : null);
          });
          return data.cases;
        }
      }
    } catch {}
    return [];
  }, []);

  const clearTrace = useCallback(() => {
    setTrace(null);
    setStatus("idle");
    setError(null);
    setTraceNote(null);
  }, []);

  // Sync with PostgreSQL / memory API on user change
  useEffect(() => {
    let mounted = true;
    clearTrace();
    async function hydrate() {
      setHydrating(true);
      try {
        const [casesRes, noticesRes] = await Promise.all([
          fetch("/api/cases").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/notices").then((r) => (r.ok ? r.json() : null))
        ]);

        if (mounted) {
          if (casesRes && Array.isArray(casesRes.cases)) {
            setCases(casesRes.cases);
            if (casesRes.cases.length > 0) {
              const firstCase = casesRes.cases[0];
              setActiveCase(firstCase);
              setCaseMetaState((prev) => ({
                ...prev,
                ncrp_ack_no: firstCase.case_number,
                amount_lost_inr: Number(firstCase.loss_amount_inr) || prev.amount_lost_inr,
                jurisdiction_ps: firstCase.jurisdiction_code || prev.jurisdiction_ps,
                victim_name: firstCase.victim_name || prev.victim_name,
                io_name: firstCase.assigned_investigator_name || prev.io_name,
              }));
            } else {
              setActiveCase(null);
              setCaseMetaState({
                ncrp_ack_no: "",
                amount_lost_inr: 0,
                jurisdiction_ps: user?.jurisdiction_code || "MH-CYBER-01",
                victim_name: user?.name || "Rajesh Verma",
                io_name: "SI Patil",
              });
            }
          } else {
            setCases([]);
            setActiveCase(null);
          }

          const rawNotices = noticesRes
            ? Array.isArray(noticesRes)
              ? noticesRes
              : Array.isArray(noticesRes.notices)
              ? noticesRes.notices
              : []
            : [];

          setNotices(rawNotices.map((n: any) => normalizeStoredNotice(n)));
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
  }, [user?.id, user?.role, user?.jurisdiction_code, clearTrace]);

  const runTrace = useCallback(async (seed: string, linkedCase?: StoredCase): Promise<TraceResult | null> => {
    const s = seed.trim();
    if (!s) return null;
    setStatus("tracing");
    setError(null);
    setTraceNote(null);

    const targetCase = linkedCase || activeCase;
    if (targetCase) {
      setActiveCase(targetCase);
      setCaseMetaState((prev) => ({
        ...prev,
        ncrp_ack_no: targetCase.case_number,
        victim_name: targetCase.victim_name || prev.victim_name,
        amount_lost_inr: Number(targetCase.loss_amount_inr) || prev.amount_lost_inr,
        jurisdiction_ps: targetCase.jurisdiction_code || prev.jurisdiction_ps,
        io_name: user?.name || prev.io_name,
      }));
    }

    try {
      const isDemo = s.toLowerCase() === "demo";
      const payload = isDemo
        ? {
            demo: true,
            caseMeta: targetCase
              ? {
                  ncrp_ack_no: targetCase.case_number,
                  victim_name: targetCase.victim_name,
                  amount_lost_inr: Number(targetCase.loss_amount_inr),
                  jurisdiction_ps: targetCase.jurisdiction_code,
                  io_name: user?.name,
                }
              : undefined,
          }
        : {
            seed: s,
            caseMeta: targetCase
              ? {
                  ncrp_ack_no: targetCase.case_number,
                  victim_name: targetCase.victim_name,
                  amount_lost_inr: Number(targetCase.loss_amount_inr),
                  jurisdiction_ps: targetCase.jurisdiction_code,
                  io_name: user?.name,
                }
              : undefined,
          };
      const res = await postJSON<any>("/api/trace", payload);

      if (!res || res.error || !res.nodes) {
        setStatus("error");
        setError(res?.error || "Trace request failed.");
        setTraceNote(res?.note || res?.hint || null);
        return null;
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

      // Synchronize with database: Update case status to TRACED
      if (targetCase) {
        try {
          await fetch("/api/cases", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              case_number: targetCase.case_number,
              status: "TRACED",
              suspect_wallet_address: s,
              blockchain_network: traceResult.seed_chain || targetCase.blockchain_network || "Ethereum",
            }),
          });
          void loadCases();
        } catch {
          // Non-blocking
        }
      } else {
        // Persist new case record
        try {
          await postJSON("/api/cases", {
            case_number: `MH-${Date.now().toString().slice(-6)}`,
            suspect_wallet_address: isDemo ? (traceResult.seed || "0x24f3aeabd426f663385b80e89f85ec997e8f06f3") : s,
            blockchain_network: traceResult.seed_chain || "ETHEREUM",
            status: "TRACED",
          });
          void loadCases();
        } catch {
          // Non-blocking
        }
      }

      return traceResult;
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Failed to reach tracing engine.");
      return null;
    }
  }, [activeCase, user?.name, loadCases]);

  const loadDemo = useCallback(async () => {
    await runTrace("demo");
  }, [runTrace]);


  const setCaseMeta = useCallback((patch: Partial<CaseMeta>) => {
    setCaseMetaState((prev) => ({ ...prev, ...patch }));
  }, []);

  const generateNotice = useCallback(
    (targetVaspName: string, targetCaseNumber?: string): string | null => {
      if (!evidence) return null;
      const cNumber = targetCaseNumber || activeCase?.case_number || caseMeta.ncrp_ack_no;
      const metaToUse: CaseMeta = activeCase
        ? {
            ...caseMeta,
            ncrp_ack_no: activeCase.case_number,
            victim_name: activeCase.victim_name || caseMeta.victim_name,
            amount_lost_inr: Number(activeCase.loss_amount_inr) || caseMeta.amount_lost_inr,
            jurisdiction_ps: activeCase.jurisdiction_code || caseMeta.jurisdiction_ps,
          }
        : caseMeta;

      const notice = section91Notice(evidence, metaToUse, targetVaspName);

      // Always drafted. Whether this becomes an issued, signed order is the
      // server's call under POL-05, and the client no longer guesses at it - the
      // old `is_gazetted ? "Issued" : "Draft"` shortcut meant the screen showed
      // an issued order a moment before the server had decided whether the
      // officer was allowed to issue one.
      const draftId = `NOTICE-${Date.now()}`;
      const newNotice: StoredNotice = {
        id: draftId,
        status: "Draft",
        createdAt: Date.now(),
        notice,
        case_number: cNumber,
        target_vasp: targetVaspName,
        drafted_by_name: user?.fullName || user?.name || undefined,
      };

      setNotices((prev) => [newNotice, ...prev]);

      postJSON<any>("/api/notices", {
        id: draftId,
        case_number: cNumber,
        target_vasp: targetVaspName,
        status: "Draft",
        drafted_by_name: user?.fullName || user?.name,
        notice,
      })
        .then((res) => {
          if (res?.notice) {
            const fromServer = normalizeStoredNotice(res.notice);
            setNotices((prev) => prev.map((n) => (n.id === draftId ? fromServer : n)));
          }
          void loadCases();
        })
        .catch(() => {});

      return draftId;
    },
    [evidence, caseMeta, activeCase, user, loadCases]
  );

  /**
   * Draft -> Issued. This is the moment the server signs, so the reconciled
   * notice that comes back is the only place a signature ever enters client
   * state.
   *
   * "Acknowledged" is deliberately not reachable from here. That transition
   * belongs to the exchange, is recorded through recordVaspResponse, and used to
   * be settable by any police user clicking a tab - which recorded the exchange
   * as having replied when it had not.
   */
  const issueNotice = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      const target = notices.find((n) => n.id === id);
      if (!target) return { success: false, error: "That requisition is no longer in this session." };

      try {
        const res = await postJSON<any>("/api/notices", {
          id,
          status: "Issued",
          case_number: target.case_number || target.notice?.case?.ncrp_ack_no,
          target_vasp: target.target_vasp || target.notice?.to_vasp,
          drafted_by_name: target.drafted_by_name,
          notice: target.notice,
        });

        if (res?.error || !res?.notice) {
          return { success: false, error: res?.error || "The server did not accept the issuance." };
        }

        const fromServer = normalizeStoredNotice(res.notice);
        setNotices((prev) => prev.map((n) => (n.id === id ? fromServer : n)));
        void loadCases();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || "Could not reach the notice service." };
      }
    },
    [notices, loadCases]
  );

  /** Re-read notices from the server, e.g. after an exchange has replied. */
  const refreshNotices = useCallback(async () => {
    try {
      const res = await fetch("/api/notices");
      if (!res.ok) return;
      const data = await res.json();
      const raw = Array.isArray(data) ? data : Array.isArray(data?.notices) ? data.notices : [];
      setNotices(raw.map((n: any) => normalizeStoredNotice(n)));
    } catch {}
  }, []);

  /**
   * Drops a notice from this session's view only. Issued orders are statutory
   * records and the server keeps them; nothing here deletes anything.
   */
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
        blockchain_network: "Ethereum",
      };

      try {
        const res = await postJSON<any>("/api/ingest/ncrp", payload);
        if (res.success && res.case) {
          const ingestedCase = res.case as StoredCase;
          setActiveCase(ingestedCase);
          setCaseMetaState({
            ncrp_ack_no: ingestedCase.case_number,
            io_name: user?.fullName || user?.name || "Officer Sharma",
            victim_name: ingestedCase.victim_name || "Rajesh Verma",
            amount_lost_inr: Number(ingestedCase.loss_amount_inr) || 450000,
            jurisdiction_ps: ingestedCase.jurisdiction_code || "MH-CYBER-01",
          });

          await loadCases();

          // Only automatically run trace for law enforcement roles (not citizen victims)
          if (user?.role !== "VICTIM" && user?.role !== "EXCHANGE_NODAL_OFFICER" && user?.role !== "AUDITOR") {
            await runTrace(ingestedCase.suspect_wallet_address, ingestedCase);
          }

          return ingestedCase;
        }
      } catch (err) {
        // The ingest failed. Surface that rather than papering over it with a
        // fabricated demo trace — a live console must never silently substitute
        // sample data for a real complaint that did not go through.
        console.error("[CryptoTrace] NCRP ingest failed:", err);
      }
      return null;
    },
    [user, runTrace, loadCases]
  );

  /**
   * Withdraw a complaint the signed-in citizen filed. The server enforces that
   * it is still an untouched intake (PENDING_TRACING, no freeze order) and that
   * the caller owns it - the client just relays the outcome and reloads the list
   * so the withdrawn case disappears. A 409 (already under investigation) or 403
   * comes back as { success:false, error } for the view to surface.
   */
  const withdrawComplaint = useCallback(
    async (caseNumber: string): Promise<{ success: boolean; error?: string }> => {
      if (!caseNumber) return { success: false, error: "No complaint selected." };
      try {
        const res = await fetch(`/api/cases?case_number=${encodeURIComponent(caseNumber)}`, {
          method: "DELETE",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) {
          return { success: false, error: data?.error || "The complaint could not be withdrawn." };
        }
        await loadCases();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || "Could not reach the case service." };
      }
    },
    [loadCases]
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
        cases,
        activeCase,
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
        setActiveCase,
        loadCases,
        generateNotice,
        issueNotice,
        refreshNotices,
        removeNotice,
        refreshTrace,
        ingestNcrpComplaint,
        withdrawComplaint,
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


