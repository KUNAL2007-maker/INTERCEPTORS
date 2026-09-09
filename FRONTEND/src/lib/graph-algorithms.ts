// Graph analysis + explainable risk scoring for a wallet trace.
//
// This is a faithful TypeScript port of the graph/ML risk engine from a
// collaborator's Python prototype (ANISHA/graph_engine/ai_risk_engine.py in
// techyhafiz/SIH2K26). It runs over the in-memory WalletNode[] / WalletTransfer[]
// the tracer already produces, so it needs no database and no Python at request
// time. Neo4j, when configured, is an optional persisted projection of the same
// graph (see graph-neo4j.ts); the algorithms here are the in-memory fallback and
// the always-available default.
//
// Two things live here and they are deliberately separate:
//
//   1. GRAPH ANALYSIS for the investigator's canvas — shortestPathToVasp,
//      detectSyndicateHubs, exportForCytoscape. These are built to be genuinely
//      useful forensic views and are not constrained by the ML model's shape.
//
//   2. The ML FEATURE VECTOR + the explainable Factors A–G heuristic. The 18
//      features and the heuristic reproduce the ported model's *inference-time*
//      behaviour EXACTLY — including the four features that Python never
//      populated from the graph and left at fixed defaults — so the exported
//      ONNX model (src/lib/ml/*) sees the same feature distribution it was
//      trained and calibrated against. Diverging here would make the shipped
//      model behave differently from the one it was ported from. When the model
//      is retrained on a real-world labelled dataset, feature extraction and
//      training advance together; that is the documented path, not this file.
//
// IMPORTANT boundary: this module does NOT replace the tracer's own per-wallet
// risk_score (domain.ts scoreWallet). That score drives the existing trace/graph
// views and the legal-notice figures. The assessment produced here is an
// additional analytical overlay surfaced through /api/graph and the Crime Canvas,
// exactly as the Python prototype kept its ML score decoupled from the graph.
//
// Pure and dependency-free: it imports only types and formatters from domain.ts
// (which does not import this module, so there is no cycle) and reads no
// environment. All heavier concerns — the ONNX model, Neo4j — compose on top.

import {
  chainColor,
  nodeRadius,
  severityColor,
  shortWallet,
  type Chain,
  type RiskBand,
  type TokenSymbol,
  type WalletNode,
  type WalletTransfer,
} from "./domain";

// ─────────────────────────────────────────────────────────────────────────────
// Feature schema — the 18-element vector, in the exact order the scaler and both
// models are column-indexed on. This order is load-bearing: reordering it
// silently corrupts every prediction. Ported verbatim from FEATURE_NAMES.
// ─────────────────────────────────────────────────────────────────────────────
export const FEATURE_NAMES = [
  "in_degree", // 0  inbound transfer count
  "out_degree", // 1  outbound transfer count
  "degree_ratio", // 2  out_degree / (in_degree + 1)
  "total_inflow_usd", // 3  summed USD received
  "total_outflow_usd", // 4  summed USD sent
  "volume_retention_ratio", // 5  (in - out) / in, clamped [0,1]; ~0 == full sweep
  "avg_tx_interval_seconds", // 6  mean gap between a wallet's transfers
  "velocity_burst_score", // 7  banded from the interval; <120s == 1.0
  "hops_to_mixer", // 8  undirected shortest path to a mixer, 0 == none
  "hops_to_sanctioned", // 9  shortest path to an OFAC/sanctioned node
  "hops_to_vasp", // 10 directed shortest path to a serviceable exchange
  "balance_depletion_rate", // 11 1.0 when the balance was wiped out
  "gas_parent_syndicate_size", // 12 sister wallets funded by a shared gas parent
  "unique_counterparties", // 13 distinct interacting addresses
  "pagerank_score", // 14 degree-weighted centrality approximation, [0,1]
  "betweenness_centrality", // 15 bridge-node centrality
  "community_size", // 16 size of the wallet's local cluster
  "local_clustering_coeff", // 17 triangle density around the wallet
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];

/** The 18 graph-derived features for one wallet, keyed by name. */
export type GraphFeatures = Record<FeatureName, number>;

/**
 * The four features the Python prototype declared but never populated from the
 * graph — no Cypher was ever written for them, so at inference they were always
 * the value below. We reproduce that exactly (see the module header) so the
 * ONNX model receives the distribution it was calibrated on. Populating them
 * here would require retraining the model to match.
 *
 * Consequence, carried over faithfully: Factor D (needs syndicate_size ≥ 3) and
 * Factor F (needs betweenness > 0.4) cannot fire from graph-derived features.
 * They remain implemented below for the retrain path and for any caller that
 * supplies its own feature overrides.
 */
const UNPOPULATED_DEFAULTS = {
  hops_to_sanctioned: 0,
  gas_parent_syndicate_size: 1,
  betweenness_centrality: 0.0,
  local_clustering_coeff: 0.0,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Result types
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/** One explainable contribution to the heuristic score, for the findings panel. */
export type RiskFactor = {
  factor: string;
  weight: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  evidence: string;
};

/** Output of the explainable Factors A–G heuristic, before any ML blend. */
export type HeuristicResult = {
  /** Unclamped heuristic score: base 15 plus the fired factors. */
  score: number;
  reasons: RiskFactor[];
  topology: string;
};

/**
 * A full per-wallet risk assessment. `ml_score` is null on the heuristic-only
 * path (no model available); when the ONNX model runs, the model layer re-blends
 * using `heuristic_score` and fills `ml_score`. `features` is retained so that
 * re-blend needs no re-extraction.
 */
export type RiskAssessment = {
  address: string;
  final_score: number; // rounded to 1dp, clamped [5, 99.4]
  risk_level: RiskLevel;
  badge_color: string;
  recommended_action: string;
  ml_score: number | null; // 0–100, or null when heuristic-only
  heuristic_score: number; // unclamped Factors A–G total
  reasons: RiskFactor[];
  topology: string;
  features: GraphFeatures;
};

export type ShortestPathResult = {
  hops: number;
  /** Ordered addresses from the seed to the VASP inclusive. */
  path: string[];
  vasp: { address: string; name: string; compliance_email: string; verified: boolean };
};

export type SyndicateHub = {
  address: string;
  label: string;
  chain: Chain;
  kind: "collector" | "distributor" | "passthrough";
  fan_in: number; // distinct incoming counterparties
  fan_out: number; // distinct outgoing counterparties
  total_in_usd: number;
  total_out_usd: number;
  risk_score: number;
  risk_band: RiskBand;
};

/** A Cytoscape element (node or edge). Primitive-only data, framework-agnostic. */
export type CyElement = {
  group: "nodes" | "edges";
  data: Record<string, string | number | boolean | null>;
  classes: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Address handling
//
// Within a single trace the tracer emits consistent casing, and domain.ts
// matches addresses exactly (buildGraphFromTransfers keys a Map on n.address and
// looks up by t.to_address). We follow that, with one safe accommodation: EVM
// addresses (0x…) are case-insensitive, so we canonicalise them to lowercase for
// matching to survive a checksum-case mismatch between a transfer and its node.
// TRON (base58, T…) and Bitcoin (base58/bech32) addresses are case-SENSITIVE and
// must never be lowercased, so canon() leaves any non-0x address untouched. The
// original string is always preserved for display and output.
// ─────────────────────────────────────────────────────────────────────────────
function canon(address: string): string {
  return /^0x[0-9a-fA-F]{40}$/.test(address) ? address.toLowerCase() : address;
}

type Adjacency = {
  /** Canonical address -> original-cased address actually seen (node or edge). */
  display: Map<string, string>;
  /** Canonical address -> node, when the tracer produced one. */
  nodeByCanon: Map<string, WalletNode>;
  /** Directed successors: canonical from -> [canonical to] (parallel edges kept). */
  outEdges: Map<string, string[]>;
  /** Directed predecessors: canonical to -> [canonical from]. */
  inEdges: Map<string, string[]>;
  /** Undirected neighbours: canonical -> Set(canonical). */
  undirected: Map<string, Set<string>>;
  /** Directed outgoing USD and count, and incoming, per canonical address. */
  outUsd: Map<string, number>;
  inUsd: Map<string, number>;
  /** All transfer timestamps (ms) touching a canonical address, unsorted. */
  timestamps: Map<string, number[]>;
};

function ensure<K, V>(map: Map<K, V>, key: K, make: () => V): V {
  let v = map.get(key);
  if (v === undefined) {
    v = make();
    map.set(key, v);
  }
  return v;
}

/**
 * Build the adjacency structures once; every algorithm below reads from them.
 * Self-loops (from === to) are ignored, matching the layout engine in domain.ts.
 */
function buildAdjacency(nodes: WalletNode[], transfers: WalletTransfer[]): Adjacency {
  const adj: Adjacency = {
    display: new Map(),
    nodeByCanon: new Map(),
    outEdges: new Map(),
    inEdges: new Map(),
    undirected: new Map(),
    outUsd: new Map(),
    inUsd: new Map(),
    timestamps: new Map(),
  };

  for (const n of nodes) {
    const c = canon(n.address);
    adj.display.set(c, n.address);
    adj.nodeByCanon.set(c, n);
  }

  for (const t of transfers) {
    const from = canon(t.from_address);
    const to = canon(t.to_address);
    if (!adj.display.has(from)) adj.display.set(from, t.from_address);
    if (!adj.display.has(to)) adj.display.set(to, t.to_address);

    const usd = Number.isFinite(t.value_usd) ? t.value_usd : 0;
    const ts = Number.isFinite(t.timestamp) ? t.timestamp : NaN;
    if (Number.isFinite(ts)) {
      ensure(adj.timestamps, from, () => []).push(ts);
      if (to !== from) ensure(adj.timestamps, to, () => []).push(ts);
    }

    if (from === to) continue; // ignore self-loops, as the layout engine does

    ensure(adj.outEdges, from, () => []).push(to);
    ensure(adj.inEdges, to, () => []).push(from);
    ensure(adj.undirected, from, () => new Set()).add(to);
    ensure(adj.undirected, to, () => new Set()).add(from);
    adj.outUsd.set(from, (adj.outUsd.get(from) ?? 0) + usd);
    adj.inUsd.set(to, (adj.inUsd.get(to) ?? 0) + usd);
  }

  return adj;
}

function isMixer(node?: WalletNode): boolean {
  return node?.vasp_attribution?.is_mixer === true;
}

function isServiceableVasp(node?: WalletNode): boolean {
  const v = node?.vasp_attribution;
  return !!v && v.is_verified === true && v.is_mixer !== true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shortest paths
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Directed BFS from the seed, following transfer direction, to the nearest
 * serviceable (verified, non-mixer) VASP — the off-ramp an officer can serve a
 * Section 94 BNSS order on. Mirrors the Python q_vasp (directed, up to 5 hops).
 * Returns the ordered hop path, or null when no exchange is reachable in range.
 */
export function shortestPathToVasp(
  nodes: WalletNode[],
  transfers: WalletTransfer[],
  seed: string,
  maxHops = 5
): ShortestPathResult | null {
  const adj = buildAdjacency(nodes, transfers);
  return shortestPathToVaspOn(adj, seed, maxHops);
}

function shortestPathToVaspOn(adj: Adjacency, seed: string, maxHops: number): ShortestPathResult | null {
  const start = canon(seed);
  if (!adj.display.has(start)) return null;

  const prev = new Map<string, string | null>([[start, null]]);
  const dist = new Map<string, number>([[start, 0]]);
  const queue: string[] = [start];

  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    const node = adj.nodeByCanon.get(cur);
    if (d >= 1 && isServiceableVasp(node)) {
      return buildPathResult(adj, prev, cur, d, node!);
    }
    if (d >= maxHops) continue;
    for (const nb of adj.outEdges.get(cur) ?? []) {
      if (!dist.has(nb)) {
        dist.set(nb, d + 1);
        prev.set(nb, cur);
        queue.push(nb);
      }
    }
  }
  return null;
}

function buildPathResult(
  adj: Adjacency,
  prev: Map<string, string | null>,
  end: string,
  hops: number,
  vaspNode: WalletNode
): ShortestPathResult {
  const chain: string[] = [];
  let cur: string | null = end;
  while (cur !== null) {
    chain.unshift(adj.display.get(cur) ?? cur);
    cur = prev.get(cur) ?? null;
  }
  const v = vaspNode.vasp_attribution!;
  return {
    hops,
    path: chain,
    vasp: {
      address: vaspNode.address,
      name: v.vasp_name,
      compliance_email: v.compliance_email,
      verified: v.is_verified,
    },
  };
}

/**
 * Undirected shortest hop-count from a wallet to the nearest mixer, capped at
 * `maxHops`. Mirrors the Python q_mix (undirected, up to 4 hops). 0 == no link.
 */
function hopsToMixer(adj: Adjacency, from: string, maxHops = 4): number {
  return undirectedHopsToPredicate(adj, from, (n) => isMixer(n), maxHops);
}

/** Directed shortest hop-count to the nearest serviceable VASP, 0 == none. */
function hopsToVaspDirected(adj: Adjacency, from: string, maxHops = 5): number {
  const start = canon(from);
  if (!adj.display.has(start)) return 0;
  const dist = new Map<string, number>([[start, 0]]);
  const queue: string[] = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    if (d >= 1 && isServiceableVasp(adj.nodeByCanon.get(cur))) return d;
    if (d >= maxHops) continue;
    for (const nb of adj.outEdges.get(cur) ?? []) {
      if (!dist.has(nb)) {
        dist.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }
  return 0;
}

function undirectedHopsToPredicate(
  adj: Adjacency,
  from: string,
  match: (n?: WalletNode) => boolean,
  maxHops: number
): number {
  const start = canon(from);
  if (!adj.display.has(start)) return 0;
  const dist = new Map<string, number>([[start, 0]]);
  const queue: string[] = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    if (d >= 1 && match(adj.nodeByCanon.get(cur))) return d;
    if (d >= maxHops) continue;
    for (const nb of adj.undirected.get(cur) ?? []) {
      if (!dist.has(nb)) {
        dist.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Syndicate hub detection
//
// A degree-based consolidation/dispersal detector for the canvas side-panel.
// A collector (fan-in ≥ 3, low fan-out) is a mule consolidating many victims'
// funds; a distributor (fan-out ≥ 3, low fan-in) is a peel/dispersal wallet;
// both high is a pass-through laundering hub. This is a genuinely useful graph
// view and is intentionally independent of the ML feature vector.
// ─────────────────────────────────────────────────────────────────────────────
export function detectSyndicateHubs(
  nodes: WalletNode[],
  transfers: WalletTransfer[],
  minFan = 3
): SyndicateHub[] {
  const adj = buildAdjacency(nodes, transfers);
  const hubs: SyndicateHub[] = [];

  for (const [c, node] of adj.nodeByCanon) {
    const fanIn = new Set(adj.inEdges.get(c) ?? []).size;
    const fanOut = new Set(adj.outEdges.get(c) ?? []).size;
    if (fanIn < minFan && fanOut < minFan) continue;

    const kind: SyndicateHub["kind"] =
      fanIn >= minFan && fanOut >= minFan
        ? "passthrough"
        : fanIn >= minFan
          ? "collector"
          : "distributor";

    hubs.push({
      address: node.address,
      label: shortWallet(node.address),
      chain: node.chain,
      kind,
      fan_in: fanIn,
      fan_out: fanOut,
      total_in_usd: adj.inUsd.get(c) ?? 0,
      total_out_usd: adj.outUsd.get(c) ?? 0,
      risk_score: node.risk_score,
      risk_band: node.risk_band,
    });
  }

  // Busiest hubs first.
  hubs.sort((a, b) => b.fan_in + b.fan_out - (a.fan_in + a.fan_out));
  return hubs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature extraction — faithful to the Python inference path (see header)
// ─────────────────────────────────────────────────────────────────────────────

/** Extract the 18-feature vector for one wallet from the in-memory trace. */
export function extractGraphFeatures(
  address: string,
  nodes: WalletNode[],
  transfers: WalletTransfer[]
): GraphFeatures {
  const adj = buildAdjacency(nodes, transfers);
  return extractOn(adj, address, nodes.length || 1);
}

function extractOn(adj: Adjacency, address: string, totalWallets: number): GraphFeatures {
  const c = canon(address);
  const node = adj.nodeByCanon.get(c);

  // Degree = transfer COUNT (parallel edges kept), matching the prototype's
  // count(DISTINCT relationship); counterparties = DISTINCT addresses.
  const inList = adj.inEdges.get(c) ?? [];
  const outList = adj.outEdges.get(c) ?? [];
  const inDegree = inList.length;
  const outDegree = outList.length;
  const inVol = adj.inUsd.get(c) ?? 0;
  const outVol = adj.outUsd.get(c) ?? 0;

  // unique_counterparties intentionally sums the two distinct-sets separately
  // (an address that both sends and receives is counted twice), matching the
  // prototype's count(DISTINCT in_src) + count(DISTINCT out_dst).
  const uniqueCounterparties = new Set(inList).size + new Set(outList).size;

  let volumeRetention = 1.0;
  let depletion = 0.0;
  if (inVol > 0) {
    volumeRetention = Math.max(0, Math.min(1, (inVol - outVol) / inVol));
    const balance = node?.balance_usd;
    if ((typeof balance === "number" && balance <= 0) || outVol >= inVol * 0.95) {
      depletion = 1.0;
    }
  }

  // Timestamp cadence: first 20 transfers touching this wallet, ascending; mean
  // of consecutive gaps. Our timestamps are ms epoch, so gaps convert to seconds
  // by /1000 (the prototype's >1e6 auto-downscale served the same purpose for
  // its ambiguously-typed timestamps).
  let avgIntervalSeconds = 3600.0;
  let velocity = 0.0;
  const ts = (adj.timestamps.get(c) ?? []).slice().sort((a, b) => a - b).slice(0, 20);
  if (ts.length > 1) {
    let sum = 0;
    for (let i = 1; i < ts.length; i++) sum += ts[i] - ts[i - 1];
    avgIntervalSeconds = sum / (ts.length - 1) / 1000;
    velocity =
      avgIntervalSeconds < 120 ? 1.0 : avgIntervalSeconds < 600 ? 0.75 : avgIntervalSeconds < 3600 ? 0.4 : 0.1;
  }

  const hopsMixer = hopsToMixer(adj, address, 4);
  const hopsVasp = hopsToVaspDirected(adj, address, 5);

  // pagerank: degree-weighted centrality approximation, exactly as the Python
  // inference path computed it — NOT a true PageRank. Kept so Factor E remains
  // meaningfully triggerable and the model sees a matching distribution.
  const pagerank = Math.min(1.0, (inDegree + outDegree) / Math.max(totalWallets, 1));

  // community_size: distinct wallets reachable within 3 undirected hops, +1
  // (the prototype's off-by-one is preserved for feature-distribution fidelity).
  const communitySize = undirectedReachCount(adj, address, 3) + 1;

  return {
    in_degree: inDegree,
    out_degree: outDegree,
    degree_ratio: outDegree / (inDegree + 1),
    total_inflow_usd: inVol,
    total_outflow_usd: outVol,
    volume_retention_ratio: volumeRetention,
    avg_tx_interval_seconds: avgIntervalSeconds,
    velocity_burst_score: velocity,
    hops_to_mixer: hopsMixer,
    hops_to_sanctioned: UNPOPULATED_DEFAULTS.hops_to_sanctioned,
    hops_to_vasp: hopsVasp,
    balance_depletion_rate: depletion,
    gas_parent_syndicate_size: UNPOPULATED_DEFAULTS.gas_parent_syndicate_size,
    unique_counterparties: uniqueCounterparties,
    pagerank_score: pagerank,
    betweenness_centrality: UNPOPULATED_DEFAULTS.betweenness_centrality,
    community_size: communitySize,
    local_clustering_coeff: UNPOPULATED_DEFAULTS.local_clustering_coeff,
  };
}

function undirectedReachCount(adj: Adjacency, from: string, maxHops: number): number {
  const start = canon(from);
  if (!adj.display.has(start)) return 0;
  const dist = new Map<string, number>([[start, 0]]);
  const queue: string[] = [start];
  let count = 0;
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    if (d >= maxHops) continue;
    for (const nb of adj.undirected.get(cur) ?? []) {
      if (!dist.has(nb)) {
        dist.set(nb, d + 1);
        count++; // distinct connected wallet (self excluded — it starts at dist 0)
        queue.push(nb);
      }
    }
  }
  return count;
}

/** Flatten a GraphFeatures object into the ordered 18-float model input. */
export function featureVector(f: GraphFeatures): number[] {
  return FEATURE_NAMES.map((name) => f[name]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Explainable heuristic — Factors A–G, ported verbatim
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The transparent, court-facing half of the risk score. Base 15, then each
 * factor that fires adds a fixed weight. This is the always-available floor:
 * when no ML model is loaded, this is the entire score. Factor G is recorded as
 * a finding but adds nothing to the number — kept faithful to the prototype so
 * the two report identical narratives.
 */
export function scoreFactorsAtoG(f: GraphFeatures): HeuristicResult {
  let score = 15.0; // base clean score
  const reasons: RiskFactor[] = [];
  let topology = "Standard P2P Transfer";

  // Factor A — mixer / privacy-pool proximity (if/elif: hop 1 XOR hop 2)
  if (f.hops_to_mixer === 1) {
    score += 45.0;
    reasons.push({
      factor: "Direct Proximity to Privacy Pool / Mixer (Hop 1)",
      weight: "+45%",
      severity: "CRITICAL",
      evidence: "Wallet interacted directly with a Tornado Cash / privacy protocol.",
    });
    topology = "Privacy Mixer Obfuscation Circuit";
  } else if (f.hops_to_mixer === 2) {
    score += 25.0;
    reasons.push({
      factor: "Secondary Mixer Layering (Hop 2)",
      weight: "+25%",
      severity: "HIGH",
      evidence: "Two-hop link to an anonymising mixer contract.",
    });
    topology = "Privacy Mixer Obfuscation Circuit";
  }

  // Factor B — rapid burst velocity (peel-chain heuristic)
  if (f.velocity_burst_score >= 0.8) {
    score += 25.0;
    reasons.push({
      factor: "High-Velocity Rapid Dispersal (< 120s)",
      weight: "+25%",
      severity: "HIGH",
      evidence: `Average transfer interval is ${f.avg_tx_interval_seconds.toFixed(1)}s, matching automated peeling chains.`,
    });
    topology = "Automated Peeling Chain Dispersal";
  }

  // Factor C — 100% balance depletion (sweeper-bot signature)
  if (f.balance_depletion_rate >= 1.0 && f.total_inflow_usd > 100) {
    score += 20.0;
    reasons.push({
      factor: "100% Zero-Balance Sweeper Signature",
      weight: "+20%",
      severity: "MEDIUM",
      evidence: "Incoming funds were swept immediately, leaving a zero balance.",
    });
    if (topology === "Standard P2P Transfer") topology = "Intermediary Mule Sweep";
  }

  // Factor D — gas-parent syndicate clustering (inert on graph-derived features;
  // see UNPOPULATED_DEFAULTS. Active when a caller supplies a real syndicate size.)
  if (f.gas_parent_syndicate_size >= 3) {
    score += 20.0;
    reasons.push({
      factor: `Gas Parent Syndicate Cluster (${f.gas_parent_syndicate_size} sister wallets)`,
      weight: "+20%",
      severity: "HIGH",
      evidence: "Funded by a shared syndicate gas dispatcher.",
    });
    topology = "Syndicate Hub-and-Spoke Network";
  }

  // Factor E — PageRank centrality anomaly
  if (f.pagerank_score > 0.3) {
    score += 10.0;
    reasons.push({
      factor: `High PageRank Centrality (${f.pagerank_score.toFixed(3)})`,
      weight: "+10%",
      severity: "MEDIUM",
      evidence: "Wallet acts as a high-influence fund-aggregation hub in the graph.",
    });
  }

  // Factor F — betweenness bridge detection (inert on graph-derived features)
  if (f.betweenness_centrality > 0.4) {
    score += 12.0;
    reasons.push({
      factor: `Critical Bridge Node (betweenness ${f.betweenness_centrality.toFixed(3)})`,
      weight: "+12%",
      severity: "HIGH",
      evidence: "Wallet bridges otherwise-separate laundering clusters.",
    });
  }

  // Factor G — direct cash-out trail to an exchange (recorded, no score weight)
  if (f.hops_to_vasp === 1 || f.hops_to_vasp === 2) {
    reasons.push({
      factor: `Direct Gateway Cash-out Trail (${f.hops_to_vasp} hops to VASP)`,
      weight: "+10%",
      severity: "MEDIUM",
      evidence: "Direct fund flow towards a registered centralised exchange.",
    });
  }

  return { score, reasons, topology };
}

// ─────────────────────────────────────────────────────────────────────────────
// Score assembly — blend, clamp, band (ported verbatim)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Combine the ML score (0–100, or null) with the heuristic and produce the final
 * banded assessment. final = 0.55·ml + 0.45·heuristic when a model score exists,
 * else the heuristic alone; clamped to [5, 99.4] and banded ≥80/≥60/≥35.
 */
export function blendRiskScore(
  mlScore: number | null,
  heuristicScore: number
): { final_score: number; risk_level: RiskLevel; badge_color: string; recommended_action: string } {
  let final = mlScore !== null ? 0.55 * mlScore + 0.45 * heuristicScore : heuristicScore;
  final = Math.max(5.0, Math.min(99.4, final));
  final = Math.round(final * 10) / 10;

  let risk_level: RiskLevel;
  let badge_color: string;
  let recommended_action: string;
  if (final >= 80.0) {
    risk_level = "CRITICAL";
    badge_color = "#ef4444";
    recommended_action = "IMMEDIATE SECTION 94 BNSS FREEZE REQUISITION TO VASP";
  } else if (final >= 60.0) {
    risk_level = "HIGH";
    badge_color = "#f97316";
    recommended_action = "ACTIVE SURVEILLANCE & VASP KYC REQUISITION";
  } else if (final >= 35.0) {
    risk_level = "MEDIUM";
    badge_color = "#f59e0b";
    recommended_action = "TRANSACTION MONITORING & IDENTITY VERIFICATION";
  } else {
    risk_level = "LOW";
    badge_color = "#10b981";
    recommended_action = "STANDARD AUDIT TRAIL PRESERVATION";
  }
  return { final_score: final, risk_level, badge_color, recommended_action };
}

/**
 * Full heuristic-only assessment for one wallet (ml_score = null). The ONNX
 * model layer, when present, re-blends using the returned `heuristic_score` and
 * `features` without re-extracting anything.
 */
export function assessWalletHeuristic(
  address: string,
  nodes: WalletNode[],
  transfers: WalletTransfer[]
): RiskAssessment {
  const features = extractGraphFeatures(address, nodes, transfers);
  const heuristic = scoreFactorsAtoG(features);
  const blended = blendRiskScore(null, heuristic.score);
  return {
    address,
    ...blended,
    ml_score: null,
    heuristic_score: heuristic.score,
    reasons: heuristic.reasons,
    topology: heuristic.topology,
    features,
  };
}

/**
 * The whole in-memory analysis for a trace, with NO model dependency: a
 * heuristic risk assessment per wallet, the shortest path to a serviceable VASP,
 * detected syndicate hubs, and the Cytoscape element list. The /api/graph route
 * calls this, then optionally upgrades the per-wallet scores with the ONNX model.
 * Builds adjacency once and reuses it across every sub-computation.
 */
export function analyzeGraph(
  nodes: WalletNode[],
  transfers: WalletTransfer[],
  seed: string
): {
  assessments: RiskAssessment[];
  shortestPathToVasp: ShortestPathResult | null;
  syndicateHubs: SyndicateHub[];
  cytoscape: CyElement[];
} {
  const adj = buildAdjacency(nodes, transfers);
  const total = nodes.length || 1;

  const assessments: RiskAssessment[] = nodes.map((n) => {
    const features = extractOn(adj, n.address, total);
    const heuristic = scoreFactorsAtoG(features);
    const blended = blendRiskScore(null, heuristic.score);
    return {
      address: n.address,
      ...blended,
      ml_score: null,
      heuristic_score: heuristic.score,
      reasons: heuristic.reasons,
      topology: heuristic.topology,
      features,
    };
  });

  return {
    assessments,
    shortestPathToVasp: shortestPathToVaspOn(adj, seed, 5),
    syndicateHubs: detectSyndicateHubsOn(adj),
    cytoscape: exportForCytoscapeOn(adj, seed),
  };
}

function detectSyndicateHubsOn(adj: Adjacency, minFan = 3): SyndicateHub[] {
  const hubs: SyndicateHub[] = [];
  for (const [c, node] of adj.nodeByCanon) {
    const fanIn = new Set(adj.inEdges.get(c) ?? []).size;
    const fanOut = new Set(adj.outEdges.get(c) ?? []).size;
    if (fanIn < minFan && fanOut < minFan) continue;
    const kind: SyndicateHub["kind"] =
      fanIn >= minFan && fanOut >= minFan ? "passthrough" : fanIn >= minFan ? "collector" : "distributor";
    hubs.push({
      address: node.address,
      label: shortWallet(node.address),
      chain: node.chain,
      kind,
      fan_in: fanIn,
      fan_out: fanOut,
      total_in_usd: adj.inUsd.get(c) ?? 0,
      total_out_usd: adj.outUsd.get(c) ?? 0,
      risk_score: node.risk_score,
      risk_band: node.risk_band,
    });
  }
  hubs.sort((a, b) => b.fan_in + b.fan_out - (a.fan_in + a.fan_out));
  return hubs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cytoscape export
//
// Maps the trace to Cytoscape elements. Reuses severityColor / chainColor /
// shortWallet / nodeRadius from domain.ts so the canvas matches the rest of the
// app. Any address that appears on an edge but has no node (e.g. a frontier
// wallet the walk did not expand) gets a light synthetic node, so Cytoscape is
// never handed a dangling edge — which would throw and blank the whole canvas.
// ─────────────────────────────────────────────────────────────────────────────
export function exportForCytoscape(
  nodes: WalletNode[],
  transfers: WalletTransfer[],
  seed?: string
): CyElement[] {
  const adj = buildAdjacency(nodes, transfers);
  return exportForCytoscapeOn(adj, seed);
}

function exportForCytoscapeOn(adj: Adjacency, seed?: string): CyElement[] {
  const seedCanon = seed ? canon(seed) : null;
  const elements: CyElement[] = [];

  // Undirected degree for node sizing (matches the layout engine's definition).
  const degreeOf = (c: string): number => (adj.undirected.get(c) ?? new Set()).size;

  for (const [c, display] of adj.display) {
    const node = adj.nodeByCanon.get(c);
    const degree = degreeOf(c);
    const isSeed = seedCanon !== null && c === seedCanon;

    if (!node) {
      // Synthetic frontier node — present on an edge but never attributed.
      elements.push({
        group: "nodes",
        data: {
          id: display,
          label: shortWallet(display),
          address: display,
          severity: "safe",
          severityColor: severityColor("safe"),
          risk_score: 0,
          risk_band: "SAFE",
          layer_type: "UNKNOWN",
          vasp: null,
          isMixer: false,
          isVasp: false,
          isSeed,
          degree,
          size: nodeRadius(degree) * 2,
          synthetic: true,
        },
        classes: "synthetic",
      });
      continue;
    }

    const mixer = isMixer(node);
    const vasp = isServiceableVasp(node);
    const classes = [
      `sev-${node.severity}`,
      mixer ? "mixer" : "",
      vasp ? "vasp" : "",
      isSeed ? "seed" : "",
    ]
      .filter(Boolean)
      .join(" ");

    elements.push({
      group: "nodes",
      data: {
        id: node.address,
        label: shortWallet(node.address),
        address: node.address,
        chain: node.chain,
        chainColor: chainColor(node.chain),
        severity: node.severity,
        severityColor: severityColor(node.severity),
        risk_score: node.risk_score,
        risk_band: node.risk_band,
        layer_type: node.layer_type,
        vasp: node.vasp_attribution?.vasp_name ?? null,
        isMixer: mixer,
        isVasp: vasp,
        isSeed,
        hop: typeof node.hop === "number" ? node.hop : 0,
        degree,
        size: nodeRadius(degree) * 2,
        synthetic: false,
      },
      classes,
    });
  }

  // Edges. IDs are made unique per parallel edge so Cytoscape does not collapse
  // multiple transfers between the same pair.
  const seenEdgeId = new Map<string, number>();
  for (const [from, tos] of adj.outEdges) {
    for (const to of tos) {
      const base = `${from}->${to}`;
      const n = (seenEdgeId.get(base) ?? 0) + 1;
      seenEdgeId.set(base, n);
      elements.push({
        group: "edges",
        data: {
          id: `${base}#${n}`,
          source: adj.display.get(from) ?? from,
          target: adj.display.get(to) ?? to,
        },
        classes: "flow",
      });
    }
  }

  return elements;
}

/**
 * Richer edge export when transfer detail (amount, token, timestamp, tx hash) is
 * wanted on the canvas — the plain adjacency above collapses that away. Kept
 * separate so the common case stays lightweight.
 */
export function exportEdgesWithDetail(
  nodes: WalletNode[],
  transfers: WalletTransfer[]
): CyElement[] {
  const present = new Set<string>();
  for (const n of nodes) present.add(canon(n.address));
  for (const t of transfers) {
    present.add(canon(t.from_address));
    present.add(canon(t.to_address));
  }

  const byId = new Map<string, number>();
  const out: CyElement[] = [];
  transfers.forEach((t, i) => {
    const from = canon(t.from_address);
    const to = canon(t.to_address);
    if (from === to) return;
    if (!present.has(from) || !present.has(to)) return;
    const base = t.tx_hash || t.id || `e${i}`;
    const seq = (byId.get(base) ?? 0) + 1;
    byId.set(base, seq);
    out.push({
      group: "edges",
      data: {
        id: seq === 1 ? base : `${base}#${seq}`,
        source: t.from_address,
        target: t.to_address,
        amount: Number.isFinite(t.value_usd) ? t.value_usd : 0,
        currency: t.token_symbol as TokenSymbol,
        chain: t.chain,
        tx_hash: t.tx_hash,
        timestamp: Number.isFinite(t.timestamp) ? t.timestamp : 0,
        hop: typeof t.hop === "number" ? t.hop : 0,
        note: t.note ?? null,
      },
      classes: "flow",
    });
  });
  return out;
}
