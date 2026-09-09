"use client";

// Crime Canvas — the interactive fund-flow view.
//
// It renders the current trace as a Cytoscape graph and surfaces the ported
// ANISHA analysis on top of it: an explainable per-wallet risk assessment
// (Factors A–G, optionally blended with the ONNX model), the shortest directed
// path to a serviceable VASP off-ramp, and detected syndicate consolidation
// hubs. The heavy lifting lives in graph-algorithms.ts and the /api/graph route;
// this component is the presentation layer.
//
// Two data sources, degrading gracefully:
//   1. In-memory: analyzeGraph() runs synchronously over the trace the store
//      already holds, so the canvas draws instantly with the heuristic score and
//      needs no server round-trip, database, or model.
//   2. Enriched: a POST to /api/graph re-scores each wallet with the ONNX model
//      when present, verifies the shortest path in Neo4j when configured, and
//      writes the read to the audit log (chain of custody). When that call fails
//      or the model/DB are absent, the canvas simply keeps the in-memory result.
//
// Cytoscape is a browser-only library (it touches `document`), so it is loaded
// with a dynamic import inside an effect — never statically — which keeps it out
// of the server bundle and safe under SSR. Only its TYPES are imported here, and
// type imports are erased at compile time.
//
// Style: app tokens only (--panel/--border/--text-strong/--muted…), the shared
// severity/chain colors, no emoji, no gradient, no rounded-2xl.

import { useEffect, useMemo, useRef, useState } from "react";
import type { Core, ElementDefinition, EventObject, NodeSingular } from "cytoscape";
import { useTraceStore } from "@/lib/store";
import { Page, PanelHeader } from "@/components/ui/Page";
import { severityColor, shortWallet } from "@/lib/domain";
import {
  analyzeGraph,
  type GraphFeatures,
  type RiskAssessment,
  type RiskFactor,
  type ShortestPathResult,
  type SyndicateHub,
} from "@/lib/graph-algorithms";
// Type-only: fully erased at compile, so the server-side sidecar client is never
// pulled into this client bundle.
import type { AstarPathToVasp } from "@/lib/ml-service";

// The /api/graph response shape (see src/app/api/graph/route.ts). Only the fields
// this view consumes are typed; the route may send more.
type GraphApiResult = {
  shortestPathToVasp: ShortestPathResult | null;
  astarPathToVasp: AstarPathToVasp | null;
  syndicateHubs: SyndicateHub[];
  riskAssessments: RiskAssessment[];
  projectedToNeo4j: boolean;
  ml: { available: boolean; reason: string };
  mlSource?: string; // "python-xgboost" | "features-only" | "heuristic"
  gdsSource?: string; // "networkx" | "neo4j-gds" | "in-memory-ts"
  counts: { wallets: number; transfers: number; hubs: number };
  error?: string;
};

// EVM addresses are case-insensitive; canonicalise them for matching exactly as
// graph-algorithms.ts does, so a checksum-cased node still maps to its assessment.
function canon(a: string): string {
  return /^0x[0-9a-fA-F]{40}$/.test(a) ? a.toLowerCase() : a;
}

function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const int = parseInt(m[1], 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

function factorColor(sev: RiskFactor["severity"]): string {
  return sev === "CRITICAL" ? "#ef4444" : sev === "HIGH" ? "#f97316" : "#f59e0b";
}

export function CrimeCanvasView({ onGoToTrace }: { onGoToTrace?: () => void }) {
  const { trace, status } = useTraceStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [enriched, setEnriched] = useState<GraphApiResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [cyError, setCyError] = useState<string | null>(null);

  const hasTrace = !!trace && trace.nodes.length > 0;

  // 1) In-memory analysis — synchronous, always available, no dependencies.
  const analysis = useMemo(
    () => (hasTrace ? analyzeGraph(trace!.nodes, trace!.transfers, trace!.seed) : null),
    [trace, hasTrace]
  );

  // Merged assessments: server (ML-blended) when present, else the heuristic.
  const assessments = useMemo<RiskAssessment[]>(
    () => enriched?.riskAssessments ?? analysis?.assessments ?? [],
    [enriched, analysis]
  );
  const assessmentByAddr = useMemo(() => {
    const m = new Map<string, RiskAssessment>();
    for (const a of assessments) m.set(canon(a.address), a);
    return m;
  }, [assessments]);

  const shortestPath = enriched?.shortestPathToVasp ?? analysis?.shortestPathToVasp ?? null;
  const astarPath = enriched?.astarPathToVasp ?? null; // A* only exists on the sidecar path
  const hubs = enriched?.syndicateHubs ?? analysis?.syndicateHubs ?? [];
  const selectedAssessment = selected ? assessmentByAddr.get(canon(selected)) ?? null : null;

  // 2) Enriched overlay — POST the trace to /api/graph. The httpOnly auth_token
  //    cookie rides along on this same-origin request, so no header is needed.
  //    Any failure degrades silently to the in-memory analysis above.
  useEffect(() => {
    setEnriched(null);
    setSelected(null);
    if (!hasTrace) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/graph", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trace }),
          signal: ctrl.signal,
        });
        if (!res.ok) return; // 401/403/500 → keep in-memory result
        const data = (await res.json()) as GraphApiResult;
        if (!data || data.error || !Array.isArray(data.riskAssessments)) return;
        setEnriched(data);
      } catch {
        // aborted or network error — in-memory analysis stands
      }
    })();
    return () => ctrl.abort();
  }, [trace, hasTrace]);

  // 3) Build the Cytoscape instance once per analysis (i.e. per trace). Colours
  //    start from the heuristic; the ML overlay effect recolours in place after.
  useEffect(() => {
    setSelected(null);
    setCyError(null);
    if (!analysis || !containerRef.current) return;
    const container = containerRef.current;

    // Heuristic assessment per address, for the initial node colour.
    const heurByAddr = new Map(analysis.assessments.map((a) => [canon(a.address), a] as const));

    const elements: ElementDefinition[] = analysis.cytoscape.map((el) => {
      if (el.group === "edges") {
        return { group: "edges", data: el.data, classes: el.classes };
      }
      const a = heurByAddr.get(canon(String(el.data.address ?? el.data.id)));
      return {
        group: "nodes",
        data: {
          ...el.data,
          riskColor: a?.badge_color ?? (el.data.severityColor as string) ?? "#64748b",
          riskScore: a?.final_score ?? (el.data.risk_score as number) ?? 0,
          riskLevel: a?.risk_level ?? "LOW",
        },
        classes: el.classes,
      };
    });

    // Theme tokens for the framework-agnostic stylesheet.
    const css = getComputedStyle(document.documentElement);
    const tok = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const borderColor = tok("--border", "#243049");
    const labelColor = tok("--text-strong", "#e2e8f0");
    const edgeColor = tok("--muted-2", "#64748b");

    let cy: Core | null = null;
    (async () => {
      try {
        const cytoscape = (await import("cytoscape")).default;
        if (!containerRef.current) return;

        // The stylesheet is passed as-is to Cytoscape; its type varies across
        // @types/cytoscape versions, so this one array is intentionally untyped.
        const style: any[] = [
          {
            selector: "node",
            style: {
              "background-color": "data(riskColor)",
              width: "data(size)",
              height: "data(size)",
              label: "data(label)",
              "font-size": "7px",
              color: labelColor,
              "text-valign": "bottom",
              "text-halign": "center",
              "text-margin-y": 3,
              "min-zoomed-font-size": 6,
              "border-width": 1.5,
              "border-color": borderColor,
            },
          },
          { selector: "edge", style: {
              width: 1.4,
              "line-color": edgeColor,
              "target-arrow-color": edgeColor,
              "target-arrow-shape": "triangle",
              "arrow-scale": 0.8,
              "curve-style": "bezier",
              opacity: 0.65,
            } },
          { selector: "node.seed", style: { "border-color": "#38bdf8", "border-width": 3 } },
          { selector: "node.mixer", style: { "border-color": "#ef4444", "border-width": 2, "border-style": "dashed" } },
          { selector: "node.vasp", style: { "border-color": "#10b981", "border-width": 2.5 } },
          { selector: "node.synthetic", style: { opacity: 0.5, "border-style": "dotted" } },
          { selector: "node:selected", style: { "border-color": "#38bdf8", "border-width": 3.5, "overlay-opacity": 0 } },
        ];

        cy = cytoscape({
          container,
          elements,
          style,
          wheelSensitivity: 0.2,
          minZoom: 0.2,
          maxZoom: 3,
          layout: { name: "preset" },
        });

        // Root the hierarchy at the seed when we can identify it.
        const roots = cy.nodes().filter((n: NodeSingular) => n.data("isSeed") === true);
        const layoutOpts: any = {
          name: "breadthfirst",
          directed: true,
          padding: 30,
          spacingFactor: 1.15,
          animate: false,
        };
        if (roots.length) layoutOpts.roots = roots;
        cy.layout(layoutOpts).run();
        cy.fit(undefined, 40);

        cy.on("tap", "node", (evt: EventObject) => {
          setSelected(String((evt.target as NodeSingular).data("address")));
        });
        cy.on("tap", (evt: EventObject) => {
          if (evt.target === cy) setSelected(null);
        });

        cyRef.current = cy;
      } catch (err) {
        setCyError((err as Error)?.message || "Failed to load the graph canvas.");
      }
    })();

    return () => {
      if (cy) cy.destroy();
      else if (cyRef.current) cyRef.current.destroy();
      cyRef.current = null;
    };
  }, [analysis]);

  // ML overlay: recolour nodes in place when the assessment set changes (i.e.
  // when the enriched /api/graph result arrives). No relayout, no re-init.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.batch(() => {
      cy.nodes().forEach((n: NodeSingular) => {
        const a = assessmentByAddr.get(canon(String(n.data("address"))));
        if (!a) return;
        n.data("riskColor", a.badge_color);
        n.data("riskScore", a.final_score);
        n.data("riskLevel", a.risk_level);
      });
    });
  }, [assessmentByAddr]);

  // ── Empty / loading states ───────────────────────────────────────────────
  if (!hasTrace) {
    return (
      <Page width="wide" className="space-y-4">
        <PanelHeader eyebrow="Analysis" title="Crime Canvas" />
        <Panel>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="text-[13px] font-medium" style={{ color: "var(--text-strong)" }}>
              {status === "tracing" ? "Tracing funds…" : "No trace loaded"}
            </div>
            <div className="max-w-md text-[11px] text-muted-2">
              Run a wallet trace to render its fund-flow graph, risk assessment and the shortest
              path to a serviceable VASP off-ramp.
            </div>
            {status !== "tracing" && onGoToTrace && (
              <button
                onClick={onGoToTrace}
                className="mt-1 rounded border px-3 py-1.5 text-[11px] font-medium transition hover:bg-[var(--hover)]"
                style={{ borderColor: "var(--border)", color: "var(--text-strong)" }}
              >
                Go to Wallet Trace
              </button>
            )}
          </div>
        </Panel>
      </Page>
    );
  }

  const counts = enriched?.counts ?? {
    wallets: trace!.nodes.length,
    transfers: trace!.transfers.length,
    hubs: hubs.length,
  };
  const mlSource = enriched?.mlSource ?? "heuristic";
  const gdsSource = enriched?.gdsSource ?? "in-memory-ts";
  const mlXgb = mlSource === "python-xgboost";
  const gdsReal = gdsSource === "neo4j-gds" || gdsSource === "networkx";
  const gdsLabel =
    gdsSource === "neo4j-gds"
      ? "GDS: Neo4j"
      : gdsSource === "networkx"
        ? "GDS: NetworkX"
        : "GDS: in-memory";

  return (
    <Page width="wide" className="space-y-4">
      <PanelHeader
        eyebrow="Analysis"
        title="Crime Canvas"
        right={
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Chip label={`${counts.wallets} wallets`} />
            <Chip label={`${counts.transfers} transfers`} />
            <Chip
              label={mlXgb ? "XGBoost (Python)" : "ML: heuristic"}
              title={enriched?.ml?.reason}
              tone={mlXgb ? "good" : "muted"}
            />
            <Chip label={gdsLabel} tone={gdsReal ? "good" : "muted"} />
            <Chip
              label={enriched?.projectedToNeo4j ? "Neo4j-verified" : "in-memory"}
              tone={enriched?.projectedToNeo4j ? "good" : "muted"}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        {/* Graph canvas */}
        <Panel className="overflow-hidden p-0">
          <div className="relative">
            <div ref={containerRef} className="h-[600px] w-full" style={{ background: "var(--bg)" }} />
            {cyError && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-[11px] text-muted-2">
                {cyError}
              </div>
            )}
            <Legend />
          </div>
        </Panel>

        {/* Side panel */}
        <div className="space-y-4">
          <SelectedCard assessment={selectedAssessment} hasSelection={!!selected} />
          <AstarPanel path={astarPath} mlXgb={mlXgb} />
          <PathPanel path={shortestPath} verified={enriched?.projectedToNeo4j === true} />
          <HubsPanel hubs={hubs} onSelect={setSelected} />
        </div>
      </div>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentational helpers
// ─────────────────────────────────────────────────────────────────────────────

function Panel({
  title,
  hint,
  right,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md border ${className ?? ""}`}
      style={{ borderColor: "var(--border)", background: "var(--panel)" }}
    >
      {(title || right) && (
        <header
          className="flex items-center justify-between gap-2 border-b px-3 py-2"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="min-w-0">
            {title && (
              <div className="text-[12px] font-semibold" style={{ color: "var(--text-strong)" }}>
                {title}
              </div>
            )}
            {hint && <div className="text-[10px] text-muted-2">{hint}</div>}
          </div>
          {right}
        </header>
      )}
      <div className={className?.includes("p-0") ? "" : "p-3"}>{children}</div>
    </section>
  );
}

function Chip({ label, title, tone = "muted" }: { label: string; title?: string; tone?: "good" | "muted" }) {
  const good = tone === "good";
  return (
    <span
      title={title}
      className="rounded border px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider"
      style={{
        borderColor: good ? withAlpha("#10b981", 0.4) : "var(--border)",
        background: good ? withAlpha("#10b981", 0.12) : "var(--chip)",
        color: good ? "#34d399" : "var(--text-muted, #94a3b8)",
      }}
    >
      {label}
    </span>
  );
}

function Legend() {
  const items: Array<[string, string]> = [
    ["Seed", "#38bdf8"],
    ["Mixer", "#ef4444"],
    ["VASP", "#10b981"],
  ];
  return (
    <div
      className="absolute bottom-2 left-2 flex items-center gap-3 rounded border px-2 py-1"
      style={{ borderColor: "var(--border)", background: withAlpha("#0b1120", 0.7) }}
    >
      {items.map(([label, color]) => (
        <span key={label} className="flex items-center gap-1 text-[9px] text-muted-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function RiskBadge({ level, color, score }: { level: string; color: string; score: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold"
      style={{ color, background: withAlpha(color, 0.14), borderColor: withAlpha(color, 0.4) }}
    >
      {level} · {score.toFixed(1)}
    </span>
  );
}

function SelectedCard({
  assessment,
  hasSelection,
}: {
  assessment: RiskAssessment | null;
  hasSelection: boolean;
}) {
  if (!assessment) {
    return (
      <Panel title="Wallet risk">
        <div className="py-6 text-center text-[11px] text-muted-2">
          {hasSelection ? "No assessment for the selected node." : "Select a wallet to inspect its risk assessment."}
        </div>
      </Panel>
    );
  }
  const a = assessment;
  return (
    <Panel
      title="Wallet risk"
      right={<RiskBadge level={a.risk_level} color={a.badge_color} score={a.final_score} />}
    >
      <div className="space-y-3">
        <div>
          <div className="font-mono text-[11px]" style={{ color: "var(--text-strong)" }}>
            {shortWallet(a.address)}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-2">{a.topology}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Final score" value={a.final_score.toFixed(1)} />
          <FraudStat prob={a.ml_score} />
        </div>

        <div
          className="rounded px-2 py-1.5 text-[10px] font-medium"
          style={{ background: withAlpha(a.badge_color, 0.12), color: a.badge_color }}
        >
          {a.recommended_action}
        </div>

        <GdsReadout features={a.features} />

        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-2">
            Findings ({a.reasons.length})
          </div>
          {a.reasons.length === 0 ? (
            <div className="text-[10px] text-muted-2">No risk factors fired for this wallet.</div>
          ) : (
            <ul className="space-y-1.5">
              {a.reasons.map((r, i) => (
                <li
                  key={i}
                  className="rounded border px-2 py-1.5"
                  style={{ borderColor: "var(--border)", background: "var(--chip)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10.5px] font-medium" style={{ color: "var(--text-strong)" }}>
                      {r.factor}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold" style={{ color: factorColor(r.severity) }}>
                      {r.weight}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[9.5px] leading-snug text-muted-2">{r.evidence}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border px-2 py-1.5" style={{ borderColor: "var(--border)", background: "var(--chip)" }}>
      <div className="text-[9px] uppercase tracking-wider text-muted-2">{label}</div>
      <div className="mt-0.5 text-[12px] font-semibold" style={{ color: "var(--text-strong)" }}>
        {value}
      </div>
    </div>
  );
}

function fraudColor(p: number): string {
  return p >= 80 ? "#ef4444" : p >= 60 ? "#f97316" : p >= 35 ? "#f59e0b" : "#10b981";
}

// The headline XGBoost output: P(fraud) as a percent, e.g. "96%". Null when the
// Python ML sidecar isn't running (the score is heuristic-only) — shown as "—".
function FraudStat({ prob }: { prob: number | null }) {
  if (prob === null) {
    return (
      <div
        className="rounded border px-2 py-1.5"
        style={{ borderColor: "var(--border)", background: "var(--chip)" }}
        title="XGBoost fraud probability needs the Python ML sidecar; heuristic-only here."
      >
        <div className="text-[9px] uppercase tracking-wider text-muted-2">Fraud probability</div>
        <div className="mt-0.5 text-[12px] font-semibold text-muted-2">—</div>
      </div>
    );
  }
  const color = fraudColor(prob);
  return (
    <div
      className="rounded border px-2 py-1.5"
      style={{ borderColor: withAlpha(color, 0.45), background: withAlpha(color, 0.12) }}
      title="XGBoost P(fraud) — demonstration model trained on synthetic data."
    >
      <div className="text-[9px] uppercase tracking-wider text-muted-2">Fraud probability</div>
      <div className="mt-0.5 text-[14px] font-bold tabular-nums" style={{ color }}>
        {Math.round(prob)}%
      </div>
    </div>
  );
}

// Compact readout of the four GDS graph-topology features. When the sidecar runs
// these are real (NetworkX / Neo4j GDS); in heuristic-only mode betweenness and
// clustering are the TS zero-defaults, which is honest to show.
function GdsReadout({ features }: { features: GraphFeatures }) {
  const cells: Array<[string, string]> = [
    ["PageRank", features.pagerank_score.toFixed(3)],
    ["Between", features.betweenness_centrality.toFixed(3)],
    ["Community", String(Math.round(features.community_size))],
    ["Cluster", features.local_clustering_coeff.toFixed(3)],
  ];
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-2">
        GDS features
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {cells.map(([label, value]) => (
          <div
            key={label}
            className="rounded border px-1 py-1 text-center"
            style={{ borderColor: "var(--border)", background: "var(--chip)" }}
          >
            <div className="text-[8px] uppercase tracking-wide text-muted-2">{label}</div>
            <div className="mt-0.5 text-[10.5px] font-semibold tabular-nums" style={{ color: "var(--text-strong)" }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PathPanel({ path, verified }: { path: ShortestPathResult | null; verified: boolean }) {
  return (
    <Panel
      title="Shortest path to VASP"
      hint={path ? `${path.hops} hop${path.hops === 1 ? "" : "s"} to an off-ramp` : undefined}
      right={verified && path ? <Chip label="Neo4j" tone="good" /> : undefined}
    >
      {!path ? (
        <div className="py-5 text-center text-[11px] text-muted-2">
          No serviceable VASP reachable from the seed within 5 hops.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded border px-2 py-1.5" style={{ borderColor: withAlpha("#10b981", 0.4), background: withAlpha("#10b981", 0.1) }}>
            <div className="text-[11px] font-semibold" style={{ color: "#34d399" }}>
              {path.vasp.name}
            </div>
            {path.vasp.compliance_email && (
              <div className="text-[9.5px] text-muted-2">{path.vasp.compliance_email}</div>
            )}
          </div>
          <ol className="space-y-1">
            {path.path.map((addr, i) => (
              <li key={`${addr}-${i}`} className="flex items-center gap-2 text-[10px]">
                <span
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] font-semibold"
                  style={{ background: "var(--chip)", color: "var(--text-muted, #94a3b8)" }}
                >
                  {i}
                </span>
                <span className="font-mono" style={{ color: "var(--text-strong)" }}>
                  {shortWallet(addr)}
                </span>
                {i === path.path.length - 1 && <span className="text-[9px] text-muted-2">· off-ramp</span>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </Panel>
  );
}

// The genuine A* (f = g + h) victim→VASP path from the Python ML sidecar, with
// each hop's search costs exposed. Distinct from the plain-BFS "Shortest path"
// panel above: blue search accent, a g/h/f cost table, and the heuristic's own
// explanation. Only the sidecar computes this, so it's empty in heuristic mode.
function AstarPanel({ path, mlXgb }: { path: AstarPathToVasp | null; mlXgb: boolean }) {
  return (
    <Panel
      title="A* path to VASP"
      hint={path ? `${path.hops} hop${path.hops === 1 ? "" : "s"} · f = g + h` : undefined}
      right={path ? <Chip label="XGBoost sidecar" tone="good" /> : undefined}
    >
      {!path ? (
        <div className="py-5 text-center text-[11px] text-muted-2">
          {mlXgb
            ? "A* found no serviceable VASP reachable from the seed."
            : "A* pathfinding runs in the Python ML sidecar — enable it to see the g/h/f search."}
        </div>
      ) : (
        <div className="space-y-2">
          <div
            className="rounded border px-2 py-1.5"
            style={{ borderColor: withAlpha("#38bdf8", 0.4), background: withAlpha("#38bdf8", 0.1) }}
          >
            <div className="text-[11px] font-semibold" style={{ color: "#7dd3fc" }}>
              {path.vasp.name ?? shortWallet(path.vasp.address)}
            </div>
            {path.vasp.compliance_email && (
              <div className="text-[9.5px] text-muted-2">{path.vasp.compliance_email}</div>
            )}
          </div>

          <div className="overflow-hidden rounded border" style={{ borderColor: "var(--border)" }}>
            <div
              className="grid grid-cols-[1fr_1.6rem_1.6rem_1.6rem] gap-x-2 border-b px-2 py-1 text-[8.5px] font-semibold uppercase tracking-wider text-muted-2"
              style={{ borderColor: "var(--border)", background: "var(--chip)" }}
            >
              <span>Wallet</span>
              <span className="text-right">g</span>
              <span className="text-right">h</span>
              <span className="text-right">f</span>
            </div>
            {path.perNode.map((n, i) => (
              <div
                key={`${n.address}-${i}`}
                className="grid grid-cols-[1fr_1.6rem_1.6rem_1.6rem] items-center gap-x-2 px-2 py-1 text-[10px]"
                style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
              >
                <span className="truncate font-mono" style={{ color: "var(--text-strong)" }}>
                  {shortWallet(n.address)}
                </span>
                <span className="text-right tabular-nums text-muted-2">{n.g}</span>
                <span className="text-right tabular-nums text-muted-2">{n.h}</span>
                <span className="text-right font-semibold tabular-nums" style={{ color: "#7dd3fc" }}>
                  {n.f}
                </span>
              </div>
            ))}
          </div>

          {path.explanation && (
            <div className="text-[9.5px] leading-snug text-muted-2">{path.explanation}</div>
          )}
        </div>
      )}
    </Panel>
  );
}

function HubsPanel({ hubs, onSelect }: { hubs: SyndicateHub[]; onSelect: (addr: string) => void }) {
  const kindLabel: Record<SyndicateHub["kind"], string> = {
    collector: "Collector",
    distributor: "Distributor",
    passthrough: "Pass-through",
  };
  return (
    <Panel title="Syndicate hubs" hint={hubs.length ? `${hubs.length} detected` : undefined}>
      {hubs.length === 0 ? (
        <div className="py-5 text-center text-[11px] text-muted-2">No consolidation hubs detected.</div>
      ) : (
        <ul className="space-y-1.5">
          {hubs.slice(0, 12).map((h) => (
            <li key={h.address}>
              <button
                onClick={() => onSelect(h.address)}
                className="w-full rounded border px-2 py-1.5 text-left transition hover:bg-[var(--hover)]"
                style={{ borderColor: "var(--border)", background: "var(--chip)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10.5px]" style={{ color: "var(--text-strong)" }}>
                    {shortWallet(h.address)}
                  </span>
                  <span
                    className="rounded border px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wider"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted, #94a3b8)" }}
                  >
                    {kindLabel[h.kind]}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[9.5px] text-muted-2">
                  <span>in {h.fan_in}</span>
                  <span>out {h.fan_out}</span>
                  <span style={{ color: severityColor(h.risk_band === "HIGH" ? "high" : h.risk_band === "MEDIUM" ? "medium" : "safe") }}>
                    {fmtUsd(h.total_in_usd)} → {fmtUsd(h.total_out_usd)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
