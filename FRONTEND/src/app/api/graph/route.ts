import { NextResponse } from "next/server";
import { extractUserClaims } from "@/lib/auth-crypto";
import { getUserById, recordAuditLog } from "@/lib/db";
import { normalizeRole, hasPermission, PERMISSIONS } from "@/lib/rbac-abac";
import type { WalletNode, WalletTransfer } from "@/lib/domain";
import {
  analyzeGraph,
  blendRiskScore,
  scoreFactorsAtoG,
  type RiskAssessment,
} from "@/lib/graph-algorithms";
import {
  mlServiceEnabled,
  analyzeViaMlService,
  canonAddr,
  type AstarPathToVasp,
} from "@/lib/ml-service";
import { neo4jEnabled, projectTrace, queryShortestPathToVasp } from "@/lib/graph-neo4j";

// neo4j-driver (networking) and the fetch() call to the Python ML sidecar mean
// this must run on the Node.js runtime, never the Edge runtime.
export const runtime = "nodejs";
// Graph analysis is in-memory and fast; the optional Neo4j round-trip is the only
// network hop. 30s is comfortably enough and well under the trace route's 60.
export const maxDuration = 30;

// Defensive caps. The tracer emits ~40 wallets; these ceilings simply stop a
// malformed or hostile payload from turning graph analysis into a DoS. The graph
// posted here is data the caller already holds from its own RBAC-gated trace, so
// this endpoint discloses no new evidence — it re-analyses and (optionally)
// projects the caller's own trace, which is why the gate is a read permission.
const MAX_NODES = 600;
const MAX_TRANSFERS = 3000;

// The audit log's writable fields. `recordAuditLog` requires a non-null id/name/
// role; `user` below is the resolved AppUser (or the JWT claims as a fallback),
// both of which carry these.
type AuditUser = { id: string | number; name: string; role: string };

function auditDenied(user: AuditUser, reason: string) {
  recordAuditLog({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: "READ_WALLET_GRAPH",
    resource_type: "WALLET_GRAPH",
    decision: "DENIED",
    reason,
  });
}

/** Coerce one posted node into a WalletNode, dropping anything without an address. */
function sanitizeNodes(raw: unknown): WalletNode[] {
  if (!Array.isArray(raw)) return [];
  const out: WalletNode[] = [];
  for (const n of raw.slice(0, MAX_NODES)) {
    if (!n || typeof n !== "object") continue;
    const o = n as Record<string, unknown>;
    if (typeof o.address !== "string" || !o.address) continue;
    out.push(o as unknown as WalletNode);
  }
  return out;
}

function sanitizeTransfers(raw: unknown): WalletTransfer[] {
  if (!Array.isArray(raw)) return [];
  const out: WalletTransfer[] = [];
  for (const t of raw.slice(0, MAX_TRANSFERS)) {
    if (!t || typeof t !== "object") continue;
    const o = t as Record<string, unknown>;
    if (typeof o.from_address !== "string" || typeof o.to_address !== "string") continue;
    out.push(o as unknown as WalletTransfer);
  }
  return out;
}

// Analyse a fund-flow graph: shortest path to a serviceable VASP, syndicate hubs,
// per-wallet risk (explainable Factors A–G heuristic, optionally blended with the
// ONNX model when present), and a Cytoscape element list for the Crime Canvas.
// When NEO4J_URI is configured the trace is also MERGE-projected into Neo4j and
// the shortest path is verified there; otherwise everything runs in-memory.
export async function POST(req: Request) {
  try {
    const claims = await extractUserClaims(req);
    if (!claims) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required for fund-flow graph analysis." },
        { status: 401 }
      );
    }
    // getUserById resolves the JWT subject to the full AppUser; if the user row
    // is gone (e.g. deleted since issuance) we fall back to the token claims, as
    // the sibling trace route does.
    const user = getUserById(claims.id) || (claims as any);
    const role = normalizeRole(user.role);

    // Single permission gate. Unlike /api/trace (which denies court reviewers and
    // auditors from EXECUTING a trace), READING a fund-flow graph is exactly what
    // WALLET_GRAPH_READ authorises — so court reviewers, auditors, supervisors,
    // investigators and the national analyst all pass; victims, the exchange desk
    // and the system admin do not.
    if (!hasPermission(role, PERMISSIONS.WALLET_GRAPH_READ)) {
      auditDenied(user, `Access Denied: ${user.role} does not hold wallet_graph:read.`);
      return NextResponse.json(
        { error: "Access Denied: your role cannot read fund-flow graph analysis." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const src = (body?.trace && typeof body.trace === "object" ? body.trace : body) as Record<string, unknown>;
    const nodes = sanitizeNodes(src?.nodes);
    const transfers = sanitizeTransfers(src?.transfers);
    const seed =
      (typeof src?.seed === "string" && src.seed) ||
      (nodes[0]?.address ?? "");

    if (!seed || nodes.length === 0) {
      return NextResponse.json(
        { error: "Bad Request: a trace with at least one wallet and a seed is required." },
        { status: 400 }
      );
    }

    // Record the granted read — a fund-flow graph read is part of the chain of
    // custody, so it is logged, not silent.
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: "READ_WALLET_GRAPH",
      resource_type: "WALLET_GRAPH",
      decision: "GRANTED",
      reason: `Fund-flow graph analysis over ${nodes.length} wallets, seed ${seed}.`,
    });

    // 1) In-memory analysis — always runs, needs no database or model.
    const analysis = analyzeGraph(nodes, transfers, seed);

    // 2) Optional Python ML sidecar overlay (real GDS + XGBoost + A*). When
    //    ML_SERVICE_URL is set and the sidecar answers, we adopt its REAL GDS
    //    features, re-run the explainable Factors A–G on them (so genuine
    //    betweenness / pagerank / community now drive Factors E/F, not the
    //    zero-defaults), and blend in the XGBoost fraud probability via the app's
    //    own blendRiskScore. analyzeViaMlService returns null on ANY failure, in
    //    which case the heuristic-only assessments below are used unchanged —
    //    exactly today's behaviour. Supersedes the dormant ONNX scaffold.
    let assessments: RiskAssessment[] = analysis.assessments;
    let astarPathToVasp: AstarPathToVasp | null = null;
    let mlSource = "heuristic";
    let gdsSource = "in-memory-ts";
    let modelKind = "none";

    if (mlServiceEnabled()) {
      const ml = await analyzeViaMlService(nodes, transfers, seed);
      if (ml) {
        astarPathToVasp = ml.astarPathToVasp;
        gdsSource = ml.gdsSource;
        mlSource = ml.mlSource;
        modelKind = ml.modelKind;
        assessments = assessments.map((a) => {
          const key = canonAddr(a.address);
          const feats = ml.features.get(key) ?? a.features;
          const fraud = ml.fraud.get(key) ?? null;
          // Re-run the heuristic on the real features, then blend.
          const heuristic = scoreFactorsAtoG(feats);
          const blended = blendRiskScore(fraud, heuristic.score);
          return {
            ...a,
            ...blended,
            ml_score: fraud,
            heuristic_score: heuristic.score,
            reasons: heuristic.reasons,
            topology: heuristic.topology,
            features: feats,
          };
        });
      }
    }
    const mlAvailable = mlSource === "python-xgboost";

    // 3) Optional Neo4j projection + Cypher-verified shortest path.
    let projectedToNeo4j = false;
    let shortestPathToVasp = analysis.shortestPathToVasp;
    if (neo4jEnabled()) {
      const projected = await projectTrace({ nodes, transfers });
      projectedToNeo4j = projected > 0;
      if (projectedToNeo4j) {
        const viaNeo4j = await queryShortestPathToVasp(seed);
        if (viaNeo4j) shortestPathToVasp = viaNeo4j;
      }
    }

    return NextResponse.json({
      cytoscape: analysis.cytoscape,
      shortestPathToVasp,
      astarPathToVasp,
      syndicateHubs: analysis.syndicateHubs,
      riskAssessments: assessments,
      projectedToNeo4j,
      ml: {
        available: mlAvailable,
        reason: mlAvailable
          ? `Python XGBoost (${modelKind})`
          : mlServiceEnabled()
            ? "ML sidecar unreachable — heuristic-only."
            : "ML sidecar not configured — heuristic-only.",
      },
      mlSource,
      gdsSource,
      counts: {
        wallets: nodes.length,
        transfers: transfers.length,
        hubs: analysis.syndicateHubs.length,
      },
      generatedAt: Date.now(),
    });
  } catch (err) {
    console.error("[CryptoTrace] graph API error:", err);
    return NextResponse.json(
      { error: "The graph analysis service errored." },
      { status: 500 }
    );
  }
}
