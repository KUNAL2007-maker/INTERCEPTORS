// ─────────────────────────────────────────────────────────────────────────────
// Python ML sidecar client.
//
// Talks to the FastAPI service in ml-service/ (real GDS + XGBoost + A*) over HTTP,
// server-to-server, when ML_SERVICE_URL is set. Mirrors the degrade-don't-throw
// discipline of graph-neo4j.ts: EVERY failure path returns null, and the caller
// (/api/graph) then keeps the app's in-memory TypeScript analysis untouched. So
// the app runs identically with the sidecar off, and lights up with it on.
// ─────────────────────────────────────────────────────────────────────────────

import type { WalletNode, WalletTransfer } from "@/lib/domain";
import type { GraphFeatures } from "@/lib/graph-algorithms";

/** One node on the A* victim→VASP path, with its search costs exposed. */
export type AstarPerNode = { address: string; g: number; h: number; f: number };

export type AstarPathToVasp = {
  path: string[];
  perNode: AstarPerNode[];
  hops: number;
  vasp: { address: string; name: string | null; compliance_email: string | null; verified: boolean };
  explanation: string;
};

export type MlServiceResult = {
  /** Real 18-feature vectors, keyed by canonical address. */
  features: Map<string, GraphFeatures>;
  /** XGBoost fraud probability (0–100) or null, keyed by canonical address. */
  fraud: Map<string, number | null>;
  astarPathToVasp: AstarPathToVasp | null;
  gdsSource: string; // "networkx" | "neo4j-gds"
  mlSource: string; // "python-xgboost" | "features-only"
  modelKind: string; // "synthetic-demo" | "none"
};

// Short budget: the sidecar analysis is in-memory and fast (<1s for ~40 wallets).
// If it can't answer promptly we degrade rather than stall the graph route.
const TIMEOUT_MS = 6000;

/**
 * Resolve the configured sidecar base URL, or null when unset. Accepts either a
 * full URL (`http://host:port`) or a bare `host:port` — the latter is what
 * Render's `fromService: { property: hostport }` substitutes for a private
 * service — prepending `http://` when no scheme is present, and stripping any
 * trailing slash. Cheap string work, no network.
 */
export function mlServiceBase(): string | null {
  const raw = process.env.ML_SERVICE_URL?.trim();
  if (!raw) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/+$/, "");
}

/** True when a sidecar URL is configured. Cheap boolean, no network. */
export function mlServiceEnabled(): boolean {
  return mlServiceBase() !== null;
}

/** Match graph-algorithms.ts canon(): lowercase EVM only; leave TRON/BTC as-is. */
export function canonAddr(address: string): string {
  return /^0x[0-9a-fA-F]{40}$/.test(address) ? address.toLowerCase() : address;
}

/**
 * POST the trace to the sidecar's /analyze. Returns null on ANY problem (URL
 * unset, timeout, non-200, malformed body, network error) — never throws.
 */
export async function analyzeViaMlService(
  nodes: WalletNode[],
  transfers: WalletTransfer[],
  seed: string
): Promise<MlServiceResult | null> {
  const base = mlServiceBase();
  if (!base) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, transfers, seed }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as unknown;
    if (!data || typeof data !== "object") return null;
    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.perWallet)) return null;

    const features = new Map<string, GraphFeatures>();
    const fraud = new Map<string, number | null>();
    for (const w of d.perWallet) {
      if (!w || typeof w !== "object") continue;
      const o = w as Record<string, unknown>;
      if (typeof o.address !== "string") continue;
      const key = canonAddr(o.address);
      if (o.features && typeof o.features === "object") {
        features.set(key, o.features as GraphFeatures);
      }
      fraud.set(key, typeof o.fraud_probability === "number" ? o.fraud_probability : null);
    }

    return {
      features,
      fraud,
      astarPathToVasp: (d.astarPathToVasp as AstarPathToVasp | null) ?? null,
      gdsSource: typeof d.gdsSource === "string" ? d.gdsSource : "networkx",
      mlSource: typeof d.mlSource === "string" ? d.mlSource : "features-only",
      modelKind: typeof d.modelKind === "string" ? d.modelKind : "none",
    };
  } catch {
    return null; // degrade to the in-memory TS engine
  } finally {
    clearTimeout(timer);
  }
}
