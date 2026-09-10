"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  buildGraphFromTransfers,
  chainColor,
  detectPattern,
  formatUSD,
  nodeRadius,
  severityColor,
  shortWallet,
  CHAINS,
  type Chain,
  type GraphCluster,
  type GraphEdge,
  type GraphNode,
  type LayerType,
} from "@/lib/domain";
import { CoinLogo, ExchangeLogo, EXCHANGE_LEGEND } from "@/lib/brand-logos";
import { useTraceStore } from "@/lib/store";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/AuthProvider";
import { normalizeRole } from "@/lib/rbac-abac";
import { SeverityBadge } from "../ui/SeverityBadge";
import { NodeDetailDrawer } from "../NodeDetailDrawer";
import { Page } from "../ui/Page";

type FilterKey = "all" | "safe" | "medium" | "high";

const W = 1240;

// Short layer tags for the crowded canvas — the drawer spells them out in full.
const LAYER_SHORT: Record<LayerType, string> = {
  VICTIM_ENTRY: "Victim",
  BURNER_MULE: "Mule",
  PEELING_CHAIN: "Peel",
  BRIDGE_HOP: "Bridge",
  VASP_DEPOSIT: "Deposit",
  VASP_HOT_WALLET: "Exchange",
};

// ── Entity typing (the "Transaction Flow" skin) ──────────────────────────────
// The graph reads as a story from victim → laundering → exchange. Each wallet is
// classified into one of five entity roles, and the whole visual language (shape,
// colour, glyph) keys off that role rather than off raw risk. This mirrors the
// investigator's mental model: a red victim card at the entry, gray hops through
// the middle, a black mixer that MUST be halted, purple relayer exits with a
// de-anon confidence, and a green exchange as the freeze target.
type EntityType = "victim" | "intermediate" | "mixer" | "relayer" | "exchange";

const ENTITY_COLOR: Record<EntityType, string> = {
  victim: "#ef4444", // red
  intermediate: "#94a3b8", // slate/gray
  mixer: "#0d1117", // black
  relayer: "#a855f7", // purple
  exchange: "#22c55e", // green
};

const ENTITY_LABEL: Record<EntityType, string> = {
  victim: "Victim wallet",
  intermediate: "Intermediate wallet",
  mixer: "Mixer (must halt)",
  relayer: "DEX / Bridge relayer",
  exchange: "Exchange (freeze target)",
};

function entityOf(n: GraphNode): EntityType {
  if (n.is_mixer) return "mixer";
  if (n.layer_type === "VICTIM_ENTRY") return "victim";
  if (n.layer_type === "VASP_HOT_WALLET" || n.layer_type === "VASP_DEPOSIT" || n.vasp) return "exchange";
  if (n.layer_type === "BRIDGE_HOP") return "relayer";
  return "intermediate"; // BURNER_MULE / PEELING_CHAIN and anything else mid-trail
}

export function GraphView({
  focusAccounts,
  onClearFocus,
  onOpenNotices,
  onGoToTrace,
}: {
  // Wallets an investigator agent named, handed over when the user clicks
  // "View on graph" in the chat. Everything else on the canvas fades back.
  focusAccounts?: string[];
  onClearFocus?: () => void;
  // Jump to the Legal Notices tab after the drawer drafts a Section 91 notice.
  onOpenNotices?: () => void;
  // Empty-state CTA — the graph only fills once a trace has seeded the store.
  onGoToTrace?: () => void;
} = {}) {
  const { user } = useAuth();
  const normRole = user ? normalizeRole(user.role) : null;
  const isCourtReviewer = normRole === "COURT_REVIEWER" || user?.role === "AUDITOR";
  const { trace, status, activeCase, generateNotice, notices } = useTraceStore();
  const loading = status === "tracing";

  // Lane and typology hues were chosen to read on the dark canvas; as lettering
  // on a white panel each one sinks below legible contrast. Light mode swaps the
  // text colour for a darker sibling of the same family — fills, strokes, dots
  // and glows keep the original hue, so the graph's palette is unchanged and
  // only the words get darker. In dark mode this returns the colour untouched.
  const { theme } = useTheme();
  const laneText = useMemo(() => {
    const darker: Record<string, string> = {
      "#38bdf8": "#0369a1", "#a78bfa": "#6d28d9", "#f59e0b": "#b45309",
      "#22c55e": "#15803d", "#ec4899": "#be185d", "#06b6d4": "#0e7490",
      "#f97316": "#c2410c", "#8b5cf6": "#6d28d9", "#14b8a6": "#0f766e",
      "#e11d48": "#be123c", "#ef4444": "#dc2626", "#10b981": "#047857",
    };
    return (c: string) => (theme === "light" ? darker[c] ?? c : c);
  }, [theme]);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    nodes: NODES,
    edges: EDGES,
    chains: CHAINS_USED,
    clusters: CLUSTERS,
    height: H,
  } = useMemo(() => {
    const nodesIn = trace?.nodes ?? [];
    const transfers = trace?.transfers ?? [];
    if (!nodesIn.length)
      return {
        nodes: [] as GraphNode[],
        edges: [] as GraphEdge[],
        chains: [] as Chain[],
        clusters: [] as GraphCluster[],
        height: 560,
      };
    return buildGraphFromTransfers(nodesIn, transfers, W);
  }, [trace]);

  // The chains this trace touched — the crypto analogue of FinGuard's bank lanes.
  const displayChains = useMemo(
    () =>
      CHAINS_USED.map((c) => ({
        id: c,
        name: CHAINS[c].name,
        code: CHAINS[c].short,
        color: chainColor(c),
      })),
    [CHAINS_USED]
  );

  const nodeIndex = useMemo(() => {
    const m = new Map<string, GraphNode>();
    NODES.forEach((n) => m.set(n.id, n));
    return m;
  }, [NODES]);

  const visibleNodes = useMemo(
    () => NODES.filter((n) => (filter === "all" ? true : n.severity === filter)),
    [filter, NODES]
  );
  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => EDGES.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
    [visibleIds, EDGES]
  );

  // Wallets arriving from the chat, kept only if they exist on this canvas.
  const pinned = useMemo(
    () => (focusAccounts ?? []).filter((a) => nodeIndex.has(a)),
    [focusAccounts, nodeIndex]
  );

  // Two different jobs, kept apart on purpose. Wallets arriving from the chat get
  // a standing highlight — a marked ring plus a permanent label — and every other
  // node stays fully visible, because arriving on a canvas showing one lit ring
  // and nothing else hides the context that makes the ring mean something. Hover
  // is the transient one, and it only softens the rest rather than blanking it.
  const spread = useCallback(
    (roots: string[]) => {
      const s = new Set<string>(roots);
      EDGES.forEach((e) => {
        if (s.has(e.source)) s.add(e.target);
        if (s.has(e.target)) s.add(e.source);
      });
      return s;
    },
    [EDGES]
  );

  const highlightIds = useMemo(() => (pinned.length ? spread(pinned) : null), [pinned, spread]);
  const hoverIds = useMemo(() => (hover ? spread([hover]) : null), [hover, spread]);

  const highCount = NODES.filter((n) => n.severity === "high").length;
  const medCount = NODES.filter((n) => n.severity === "medium").length;

  // The multi-wallet rings — the typology panel's list, the "Rings" stat and its
  // empty state all read this, and computing it three times from CLUSTERS was how
  // the stat and the list could disagree.
  const webClusters = useMemo(() => CLUSTERS.filter((c) => c.kind === "web"), [CLUSTERS]);

  // The 1240px canvas is wider than the pane at almost every breakpoint — on a
  // phone the pane is ~340px, and even on a laptop with the sidebar open it sits
  // well under 1240. At 100% the graph then spills past the right edge and the
  // user has to scroll sideways to find the exchange (the reported "graph goes
  // outside the window"). Fitting the whole canvas width into the pane on first
  // paint — and on every resize, via a ResizeObserver on the actual scroll box —
  // keeps the entire victim→exchange flow on screen. We never enlarge past 100%,
  // and the moment the user touches the zoom controls we stop auto-fitting so
  // their choice sticks.
  const touchedZoom = useRef(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const apply = () => {
      setNarrow(window.matchMedia("(max-width: 1023px)").matches);
      if (touchedZoom.current) return;
      const cw = el.clientWidth;
      if (!cw) return;
      setZoom(Math.max(0.16, Math.min(1, (cw - 12) / W)));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [H, NODES.length]);

  const zoomBy = (fn: (z: number) => number) => {
    touchedZoom.current = true;
    setZoom(fn);
  };

  if (loading) {
    return (
      <Page width="wide" fill>
        <div className="flex h-full min-h-[420px] items-center justify-center" style={{ color: "var(--muted)" }}>
          Tracing the money…
        </div>
      </Page>
    );
  }

  if (NODES.length === 0) {
    return (
      <Page width="wide" fill>
        <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3">
          <div className="text-[32px] opacity-30">◇</div>
          <div className="text-[14px] font-medium" style={{ color: "var(--text-strong)" }}>
            No wallet traced yet
          </div>
          <div className="text-[12.5px]" style={{ color: "var(--muted-2)" }}>
            Seed a case in Trace Wallet to build the multi-chain flow graph.
          </div>
          {onGoToTrace && (
            <button
              onClick={onGoToTrace}
              className="mt-1 rounded-lg px-4 py-2 text-[13px] font-medium text-black transition"
              style={{ background: "linear-gradient(135deg,#22c55e,#10b981)" }}
            >
              Go to Trace Wallet →
            </button>
          )}
        </div>
      </Page>
    );
  }

  const fittedH = Math.round(H * zoom) + 8;
  const viewportH = narrow ? fittedH : Math.min(760, Math.max(520, fittedH));

  const fitToView = () => {
    const el = scrollRef.current;
    if (!el) return;
    touchedZoom.current = true;
    setZoom(Math.max(0.3, Math.min(1, (el.clientWidth - 12) / W)));
  };

  return (
    <Page width="wide" className="space-y-4">
      {/* ── Network canvas (full width) ─────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <div>
              <div className="text-[14px] font-semibold leading-tight" style={{ color: "var(--text-strong)" }}>
                {activeCase
                  ? `Money-Flow Graph · ${activeCase.case_number}`
                  : "Transaction Flow"}
              </div>
              <div className="text-[11px] leading-tight" style={{ color: "var(--muted)" }}>
                {activeCase
                  ? `${activeCase.victim_name || "Complainant"} · suspect ${shortWallet(activeCase.suspect_wallet_address)} → exchange`
                  : "Visual trace from victim wallet to exchange (multi-chain)"}
              </div>
            </div>
            <span
              className="text-[11px] rounded px-1.5 py-0.5 border"
              style={{ borderColor: "var(--border)", background: "var(--chip)", color: "var(--muted)" }}
            >
              {CLUSTERS.length} clusters · {NODES.length} wallets
            </span>
            {highCount > 0 && (
              <span className="text-[11px] rounded px-1.5 py-0.5 bg-red-500/10 border border-red-500/25 text-red-300">
                {highCount} high-risk
              </span>
            )}
            {medCount > 0 && (
              <span className="text-[11px] rounded px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-300">
                {medCount} medium
              </span>
            )}
            {pinned.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] rounded px-1.5 py-0.5 bg-sky-500/10 border border-sky-500/30 text-sky-200">
                Focused on {pinned.length} {pinned.length === 1 ? "wallet" : "wallets"} from the investigation
                {onClearFocus && (
                  <button onClick={onClearFocus} className="underline decoration-dotted hover:text-sky-100">
                    clear
                  </button>
                )}
              </span>
            )}
            {activeCase && (
              <span className="text-[11px] font-mono rounded px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                Case: {activeCase.case_number} · {shortWallet(activeCase.suspect_wallet_address)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenNotices && !isCourtReviewer && (
              <button
                onClick={() => {
                  if (notices.length === 0 || (activeCase && !notices.some((n) => n.case_number === activeCase.case_number))) {
                    const vaspName = (CLUSTERS.length > 0 && CLUSTERS[0].label ? CLUSTERS[0].label : activeCase?.target_vasp) || "Binance International";
                    generateNotice(vaspName, activeCase?.case_number);
                  }
                  onOpenNotices();
                }}
                className="text-[11.5px] rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 px-3 py-1.5 font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>⚖️</span>
                <span>Prepare Draft Notice</span>
              </button>
            )}
            {isCourtReviewer && (
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold flex items-center gap-1.5">
                <span>⚖️</span>
                <span>BSA Sec 65B Read-Only Review</span>
              </span>
            )}
            <div className="flex gap-1">
              {(["all", "high", "medium", "safe"] as FilterKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`text-[11.5px] rounded-md border px-2.5 py-1.5 capitalize transition lg:py-1 ${
                    filter === k
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "hover:bg-[var(--hover)]"
                  }`}
                  style={filter !== k ? { borderColor: "var(--border)", color: "var(--text)" } : undefined}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="hidden w-px h-5 lg:block" style={{ background: "var(--border)" }} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => zoomBy((z) => Math.max(0.35, Math.round((z - 0.1) * 100) / 100))}
                className="h-8 w-8 rounded-md border hover:bg-[var(--hover)] lg:h-7 lg:w-7"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
                aria-label="Zoom out"
              >
                −
              </button>
              <div className="text-[11px] font-mono w-10 text-center" style={{ color: "var(--muted)" }}>
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={() => zoomBy((z) => Math.min(2, Math.round((z + 0.1) * 100) / 100))}
                className="h-8 w-8 rounded-md border hover:bg-[var(--hover)] lg:h-7 lg:w-7"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={() => zoomBy(() => 1)}
                className="text-[11px] rounded-md border px-2 py-1.5 hover:bg-[var(--hover)] lg:py-1"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
                title="Back to actual size — labels at full readability"
              >
                100%
              </button>
              <button
                onClick={fitToView}
                className="text-[11px] rounded-md border px-2 py-1.5 hover:bg-[var(--hover)] lg:py-1"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
                title="Zoom out until the whole width fits"
              >
                Fit
              </button>
            </div>
          </div>
        </div>

        <div className="relative max-h-[60vh] lg:max-h-none" style={{ height: viewportH, background: "var(--bg)" }}>
          <div ref={scrollRef} className="absolute inset-0 overflow-auto">
            <svg
              width={Math.round(W * zoom)}
              height={Math.round(H * zoom)}
              viewBox={`0 0 ${W} ${H}`}
              style={{ display: "block" }}
            >
              <defs>
                <marker id="arrowRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
                <marker id="arrowAmber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
                <marker id="arrowGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e" />
                </marker>
                <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(239,68,68,0.5)" />
                  <stop offset="100%" stopColor="rgba(239,68,68,0)" />
                </radialGradient>
                {/* Purple marker for the relayer fan-out; entity-typed edge heads. */}
                <marker id="arrowPurple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
                </marker>
                {/* Light dot-grid canvas backdrop (the "Transaction Flow" look). */}
                <pattern id="dotGrid" width="26" height="26" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1.5" fill={theme === "light" ? "#cbd5e1" : "#1e293b"} />
                </pattern>
              </defs>

              {/* Dot-grid background fills the whole scrollable canvas. */}
              <rect x={0} y={0} width={W} height={H} fill={theme === "light" ? "#f8fafc" : "#0b0f17"} />
              <rect x={0} y={0} width={W} height={H} fill="url(#dotGrid)" />

              {/* Cluster cards. Each ring is a titled panel — dot, typology, wallet
                  count and money moved — so the canvas reads as a list of findings
                  you can scan, instead of a field of loose circles. */}
              {CLUSTERS.map((c) => {
                if (!c.nodeIds.some((id) => visibleIds.has(id))) return null;
                const r = 14;
                const hb = 34;
                const head =
                  `M ${c.x} ${c.y + r} A ${r} ${r} 0 0 1 ${c.x + r} ${c.y}` +
                  ` L ${c.x + c.w - r} ${c.y} A ${r} ${r} 0 0 1 ${c.x + c.w} ${c.y + r}` +
                  ` L ${c.x + c.w} ${c.y + hb} L ${c.x} ${c.y + hb} Z`;
                return (
                  <g key={c.id} opacity={hoverIds ? 0.55 : 1}>
                    <rect
                      x={c.x}
                      y={c.y}
                      width={c.w}
                      height={c.h}
                      rx={r}
                      fill={`${c.color}08`}
                      stroke={`${c.color}2E`}
                      strokeWidth={1}
                      strokeDasharray={c.kind === "pairs" ? "7 6" : undefined}
                    />
                    <path d={head} fill={`${c.color}1C`} />
                    <line x1={c.x} y1={c.y + hb} x2={c.x + c.w} y2={c.y + hb} stroke={`${c.color}2E`} strokeWidth={1} />
                    <circle cx={c.x + 17} cy={c.y + 18} r={3.5} fill={c.color} />
                    <text x={c.x + 29} y={c.y + 22} fontSize={11.5} fill={laneText(c.color)} letterSpacing="0.09em" fontWeight={700}>
                      {c.label.toUpperCase()}
                    </text>
                    <text x={c.x + c.w - 16} y={c.y + 22} fontSize={10.5} textAnchor="end" fill="#94a3b8" className="font-mono">
                      {c.count} {c.kind === "pairs" ? "pairs" : "wallets"} · {formatUSD(c.total)}
                    </text>
                  </g>
                );
              })}

              {/* Edges — coloured by the role of the path, not raw severity. The
                  mixer fan-out (anything touching a mixer) is tainted → red; the
                  final hop into an exchange is the recoverable off-ramp → green;
                  everything else keeps the money-laundering purple/gray flow. */}
              {visibleEdges.map((e) => {
                const s = nodeIndex.get(e.source);
                const t = nodeIndex.get(e.target);
                if (!s || !t) return null;
                const sEnt = entityOf(s);
                const tEnt = entityOf(t);
                const touchesMixer = sEnt === "mixer" || tEnt === "mixer";
                const intoExchange = tEnt === "exchange";
                const color = touchesMixer
                  ? "#ef4444"
                  : intoExchange
                    ? "#22c55e"
                    : sEnt === "relayer" || tEnt === "relayer"
                      ? "#a855f7"
                      : severityColor(e.severity);
                // The mixer fan-out and any high-severity hop get the animated dash.
                const isHigh = e.severity === "high" || touchesMixer;
                const lit = !!highlightIds && highlightIds.has(e.source) && highlightIds.has(e.target);
                const hovered = !!hoverIds && hoverIds.has(e.source) && hoverIds.has(e.target);
                const touched = lit || hovered;
                const faded = !!hoverIds && !hovered;
                const marker = touchesMixer
                  ? "url(#arrowRed)"
                  : intoExchange
                    ? "url(#arrowGreen)"
                    : sEnt === "relayer" || tEnt === "relayer"
                      ? "url(#arrowPurple)"
                      : e.severity === "medium"
                        ? "url(#arrowAmber)"
                        : "url(#arrowGreen)";
                return (
                  <g key={e.id} opacity={faded ? 0.5 : 1} style={{ transition: "opacity 0.15s ease" }}>
                    <path
                      d={curvePath(s.x, s.y, t.x, t.y)}
                      fill="none"
                      stroke={color}
                      strokeOpacity={touched ? 1 : isHigh ? 0.85 : 0.55}
                      strokeWidth={touched ? 2.4 : isHigh ? 1.9 : 1.4}
                      strokeDasharray="6 6"
                      markerEnd={marker}
                      className="animate-dashmove"
                    />
                    {touched && (
                      <text
                        x={(s.x + t.x) / 2}
                        y={(s.y + t.y) / 2 - 6}
                        textAnchor="middle"
                        fontSize={10}
                        fill={laneText(color)}
                        className="font-mono"
                        style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 3 }}
                      >
                        {formatUSD(e.amount)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Nodes — entity-typed. Shape and colour key off the wallet's role
                  in the laundering story, not raw risk: red victim card, gray hop
                  circles with a tx-count badge, a black mixer with a pulsing red
                  MUST-HALT halo, purple relayer diamonds carrying a de-anon P=xx%
                  (only when the trace actually attributed one), and a green
                  exchange as the freeze target. */}
              {visibleNodes.map((n) => {
                const isHover = hover === n.id;
                const entity = entityOf(n);
                const eColor = ENTITY_COLOR[entity];
                const deg = n.degree ?? 1;
                const base = Math.max(nodeRadius(deg), 20);
                const r = isHover ? base + 3 : base;
                const isNamed = pinned.includes(n.id);
                const lit = !!highlightIds && highlightIds.has(n.id);
                const faded = !!hoverIds && !hoverIds.has(n.id);
                const textColor = theme === "light" ? "#0f172a" : "#e2e8f0";
                const subColor = theme === "light" ? "#475569" : "#94a3b8";
                // Purple relayers show a de-anon confidence ONLY when the trace
                // carried one — never fabricated.
                const pConf =
                  entity === "relayer" && typeof n.confidence_score === "number" && n.confidence_score > 0
                    ? Math.round(n.confidence_score)
                    : null;

                const focusRing = lit ? (
                  <circle
                    r={r + 9}
                    fill="none"
                    stroke="#38bdf8"
                    strokeOpacity={isNamed ? 0.95 : 0.5}
                    strokeWidth={isNamed ? 2.4 : 1.4}
                    strokeDasharray={isNamed ? undefined : "3 3"}
                  />
                ) : null;

                const label = (
                  <text
                    y={r + 16}
                    textAnchor="middle"
                    fontSize={9.5}
                    fontWeight={isHover || isNamed ? 700 : 500}
                    fill={textColor}
                    className="font-mono"
                    style={{ paintOrder: "stroke", stroke: theme === "light" ? "#f8fafc" : "#0b0f17", strokeWidth: 3 }}
                  >
                    {shortWallet(n.label)}
                  </text>
                );
                const sublabel = (
                  <text
                    y={r + 28}
                    textAnchor="middle"
                    fontSize={8.5}
                    fill={subColor}
                    style={{ paintOrder: "stroke", stroke: theme === "light" ? "#f8fafc" : "#0b0f17", strokeWidth: 3 }}
                  >
                    {CHAINS[n.chain].short} · {n.vasp ?? LAYER_SHORT[n.layer_type]}
                  </text>
                );

                const commonProps = {
                  transform: `translate(${n.x}, ${n.y})`,
                  className: "cursor-pointer",
                  opacity: faded ? 0.55 : 1,
                  style: { transition: "opacity 0.15s ease" as const },
                  onMouseEnter: () => setHover(n.id),
                  onMouseLeave: () => setHover(null),
                  onClick: () => setSelected(n),
                };

                // The forensic role now lives entirely in this coloured ring —
                // the token inside carries the coin/exchange brand identity. A
                // soft glow in the entity hue makes the role legible at a glance
                // without hiding the logo it frames.
                const roleRing = (
                  <circle
                    r={r + 4.5}
                    fill="none"
                    stroke={eColor}
                    strokeWidth={isHover ? 2.8 : 2.2}
                    style={{ filter: `drop-shadow(0 0 6px ${eColor}70)` }}
                  />
                );

                // ── Mixer: black circle, funnel glyph, pulsing red MUST-HALT halo ──
                if (entity === "mixer") {
                  return (
                    <g key={n.id} {...commonProps}>
                      <circle r={r + 16} fill="url(#redGlow)" />
                      {focusRing}
                      <circle r={r + 5} fill="none" stroke="#ef4444" strokeOpacity={0.7} strokeWidth={2} strokeDasharray="4 4">
                        <animate attributeName="r" from={String(r + 5)} to={String(r + 22)} dur="1.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.8" to="0" dur="1.6s" repeatCount="indefinite" />
                      </circle>
                      <circle r={r} fill="#0d1117" stroke="#ef4444" strokeWidth={2.4} style={{ filter: "drop-shadow(0 0 8px rgba(239,68,68,0.6))" }} />
                      {/* Funnel glyph */}
                      <path d="M -9 -8 L 9 -8 L 2.5 1 L 2.5 9 L -2.5 6 L -2.5 1 Z" fill="#f87171" stroke="#fca5a5" strokeWidth={0.6} />
                      {label}
                      <g transform={`translate(0, ${-(r + 14)})`}>
                        <rect x={-42} y={-11} width={84} height={17} rx={8.5} fill="#ef4444" />
                        <text textAnchor="middle" y={1.5} fontSize={9} fontWeight={800} fill="#ffffff" letterSpacing="0.05em">
                          ⚠ MUST-HALT
                        </text>
                      </g>
                      {(isHover || isNamed) && sublabel}
                    </g>
                  );
                }

                // ── Relayer: coin token in a purple ring + P=xx% de-anon badge ──
                if (entity === "relayer") {
                  return (
                    <g key={n.id} {...commonProps}>
                      {focusRing}
                      {roleRing}
                      <CoinLogo chain={n.chain} size={r * 2} />
                      {pConf !== null && (
                        <g transform={`translate(0, ${-(r + 15)})`}>
                          <rect x={-24} y={-9} width={48} height={15} rx={7.5} fill={eColor} />
                          <text textAnchor="middle" y={1.5} fontSize={9} fontWeight={800} fill="#ffffff" className="font-mono">
                            P={pConf}%
                          </text>
                        </g>
                      )}
                      {label}
                      {(isHover || isNamed) && sublabel}
                    </g>
                  );
                }

                // ── Victim: coin token in a double red ring (the reported entry) ──
                if (entity === "victim") {
                  return (
                    <g key={n.id} {...commonProps}>
                      {focusRing}
                      <circle r={r + 8} fill="none" stroke={eColor} strokeOpacity={0.4} strokeWidth={1.4} />
                      {roleRing}
                      <CoinLogo chain={n.chain} size={r * 2} />
                      {label}
                      {(isHover || isNamed) && sublabel}
                    </g>
                  );
                }

                // ── Exchange: the VASP's own logo in a green ring (freeze target) ──
                if (entity === "exchange") {
                  return (
                    <g key={n.id} {...commonProps}>
                      {focusRing}
                      {roleRing}
                      <ExchangeLogo vasp={n.vasp} size={r * 2} />
                      {label}
                      <text
                        y={r + 28}
                        textAnchor="middle"
                        fontSize={8.5}
                        fontWeight={700}
                        fill="#16a34a"
                        style={{ paintOrder: "stroke", stroke: theme === "light" ? "#f8fafc" : "#0b0f17", strokeWidth: 3 }}
                      >
                        {n.vasp ? n.vasp : "Consolidated Exit"}
                      </text>
                    </g>
                  );
                }

                // ── Intermediate: coin token in a gray ring + tx-count badge ──
                return (
                  <g key={n.id} {...commonProps}>
                    {focusRing}
                    {roleRing}
                    <CoinLogo chain={n.chain} size={r * 2} />
                    {/* Tx-count badge (counterparties) on the shoulder. */}
                    <g transform={`translate(${r - 2}, ${-(r - 2)})`}>
                      <circle r={8} fill="#334155" stroke={theme === "light" ? "#f8fafc" : "#0b0f17"} strokeWidth={1.5} />
                      <text textAnchor="middle" y={3} fontSize={9} fontWeight={700} fill="#ffffff">
                        {deg}
                      </text>
                    </g>
                    {label}
                    {(isHover || isNamed) && sublabel}
                  </g>
                );
              })}
            </svg>
          </div>

          {highCount > 0 && (
            <div
              className="graph-hud pointer-events-none absolute left-3 bottom-3 hidden rounded-md border border-red-500/25 px-2.5 py-1.5 text-[11px] font-mono text-red-300 lg:block"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              {highCount} HIGH RISK WALLETS DETECTED
            </div>
          )}
          <div
            className="graph-hud pointer-events-none absolute right-3 top-3 hidden rounded-md border px-2.5 py-1.5 text-[11px] font-mono lg:block"
            style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.45)", color: "var(--text)" }}
          >
            Hover to isolate a ring · click for the full dossier
          </div>
        </div>
      </div>

      {/* ── Legend strip ─────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-2.5 text-[12px] lg:gap-x-6"
        style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
      >
        {/* Role rings — the coloured ring around a token states its forensic role. */}
        <LegendRing color="#ef4444" label="Victim" />
        <LegendRing color="#94a3b8" label="Intermediate" />
        <LegendRing color="#0d1117" ringStroke="#ef4444" label="Mixer · must halt" />
        <LegendRing color="#a855f7" label="Relayer (DEX / bridge)" />
        <LegendRing color="#22c55e" label="Exchange" />
        <span className="hidden h-4 w-px lg:block" style={{ background: "var(--border)" }} />
        {/* Token = the coin the wallet holds, or the exchange it belongs to. */}
        <LogoChip label="ETH"><CoinLogo chain="ETHEREUM" size={32} /></LogoChip>
        <LogoChip label="BTC"><CoinLogo chain="BITCOIN" size={32} /></LogoChip>
        <LogoChip label="TRX"><CoinLogo chain="TRON" size={32} /></LogoChip>
        <LogoChip label="POL"><CoinLogo chain="POLYGON" size={32} /></LogoChip>
        <LogoChip label="SOL"><CoinLogo chain="SOLANA" size={32} /></LogoChip>
        {EXCHANGE_LEGEND.map((x) => (
          <LogoChip key={x.name} label={x.label}>
            <ExchangeLogo vasp={x.name} size={32} />
          </LogoChip>
        ))}
        <span className="hidden h-4 w-px lg:block" style={{ background: "var(--border)" }} />
        {/* Compact risk sub-legend kept for the edge colours. */}
        <LegendRow color="#ef4444" label="Tainted (mixer) flow" />
        <LegendRow color="#22c55e" label="Exit to exchange" />
        <span className="flex items-center gap-2">
          <span
            className="grid place-items-center w-4 h-4 rounded-full border text-[8px] font-bold"
            style={{ borderColor: "var(--muted)", color: "var(--text)" }}
          >
            n
          </span>
          Badge = counterparties · P= = de-anon confidence
        </span>
        <span className="w-full text-[11.5px] lg:ml-auto lg:w-auto" style={{ color: "var(--muted)" }}>
          <span className="lg:hidden">Tap any node for its full dossier · pinch or use + to zoom in</span>
          <span className="hidden lg:inline">Hover a ring to isolate it · click any node for the full dossier</span>
        </span>
      </div>

      {/* ── Reference panels ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <Panel title="Cluster inspector">
          <div className="grid shrink-0 grid-cols-4 gap-2 text-center">
            <Stat label="Nodes" value={String(NODES.length)} color={laneText("#38bdf8")} />
            <Stat label="Edges" value={String(EDGES.length)} color={laneText("#a78bfa")} />
            <Stat label="Rings" value={String(webClusters.length)} color={laneText("#f59e0b")} />
            <Stat label="High" value={String(highCount)} color={laneText("#ef4444")} />
          </div>
          <div className="h-px my-4 shrink-0" style={{ background: "var(--border)" }} />
          <div className="shrink-0 text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Chains ({displayChains.length})
          </div>
          <div className="mt-2.5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {displayChains.map((b) => (
              <div key={b.id} className="flex items-center gap-2">
                <svg width={18} height={18} viewBox="-16 -16 32 32" className="shrink-0" style={{ filter: `drop-shadow(0 0 6px ${b.color}66)` }}>
                  <CoinLogo chain={b.id} size={32} />
                </svg>
                <span className="text-[12.5px] truncate" style={{ color: "var(--text)" }}>
                  {b.name}
                </span>
                <span className="ml-auto text-[11px] font-mono" style={{ color: "var(--muted)" }}>
                  {b.code}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Detected typologies" count={webClusters.length}>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {webClusters.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
                style={{ borderColor: `${c.color}33`, background: `${c.color}0D` }}
              >
                <span className="w-2 h-2 shrink-0 rounded-full" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] truncate" style={{ color: "var(--text-strong)" }}>
                    {c.label}
                  </span>
                  <span className="block text-[10.5px]" style={{ color: "var(--muted)" }}>
                    {c.count} wallets
                  </span>
                </span>
                <span className="shrink-0 text-right text-[12px] font-mono" style={{ color: laneText(c.color) }}>
                  {formatUSD(c.total)}
                </span>
              </div>
            ))}
            {webClusters.length === 0 && (
              <div className="text-[12px]" style={{ color: "var(--muted)" }}>
                No multi-wallet rings in this trace.
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Largest hops" count={Math.min(EDGES.length, 8)}>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {EDGES.slice()
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 8)
              .map((e, i) => {
                const s = nodeIndex.get(e.source);
                const t = nodeIndex.get(e.target);
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[12px]"
                    style={{ background: "var(--bg)", borderColor: "var(--border)" }}
                  >
                    <span
                      className="grid h-4 w-4 shrink-0 place-items-center rounded text-[9.5px] font-semibold"
                      style={{ background: `${severityColor(e.severity)}1F`, color: severityColor(e.severity) }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono" style={{ color: "var(--muted)" }}>
                      {shortWallet(s?.label ?? e.source)} → {shortWallet(t?.label ?? e.target)}
                    </span>
                    <span className="shrink-0 font-mono" style={{ color: "var(--text-strong)" }}>
                      {formatUSD(e.amount)}
                    </span>
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>

      {/* ── Edge log ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--panel)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Edge Log
          </div>
          <div className="text-[11px] font-mono tabular-nums" style={{ color: "var(--muted)" }}>
            {visibleEdges.length} transfers
          </div>
        </div>
        <div className="max-h-[340px] overflow-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 z-10">
              <tr
                className="text-left text-[10.5px] uppercase tracking-widest backdrop-blur"
                style={{ color: "var(--muted)", background: "var(--panel-strong)" }}
              >
                <th className="px-4 py-2 font-medium whitespace-nowrap">Time</th>
                <th className="px-4 py-2 font-medium">From</th>
                <th className="px-4 py-2 font-medium">To</th>
                <th className="px-4 py-2 font-medium">Chain</th>
                <th className="px-4 py-2 font-medium text-right whitespace-nowrap">Value</th>
                <th className="px-4 py-2 font-medium">Severity</th>
                <th className="px-4 py-2 font-medium">Typology</th>
              </tr>
            </thead>
            <tbody>
              {visibleEdges.map((e) => {
                const s = nodeIndex.get(e.source);
                const t = nodeIndex.get(e.target);
                const pat = detectPattern(e.note);
                return (
                  <tr key={e.id} className="border-t hover:bg-[var(--hover)]" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-2 font-mono whitespace-nowrap tabular-nums" style={{ color: "var(--muted)" }}>
                      {e.timestamp.slice(0, 10)}
                    </td>
                    <td className="px-4 py-2 font-mono" style={{ color: "var(--text)" }}>
                      {shortWallet(s?.label ?? e.source)}
                    </td>
                    <td className="px-4 py-2 font-mono" style={{ color: "var(--text)" }}>
                      {shortWallet(t?.label ?? e.target)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className="text-[10.5px] rounded px-1.5 py-0.5"
                        style={{ background: `${chainColor(e.chain)}1F`, color: laneText(chainColor(e.chain)) }}
                      >
                        {CHAINS[e.chain].short}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono whitespace-nowrap tabular-nums" style={{ color: "var(--text-strong)" }}>
                      {formatUSD(e.amount)}
                    </td>
                    <td className="px-4 py-2">
                      <SeverityBadge severity={e.severity} />
                    </td>
                    <td className="px-4 py-2" style={{ color: "var(--muted)" }}>
                      {pat?.label ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <NodeDetailDrawer
        node={selected}
        edges={EDGES}
        onClose={() => setSelected(null)}
        onOpenNotices={
          onOpenNotices &&
          (() => {
            setSelected(null);
            onOpenNotices();
          })
        }
      />
    </Page>
  );
}

// A gentle quadratic bow so parallel hops between the same two wallets don't
// overlap into a single line.
function curvePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const nx = -dy;
  const ny = dx;
  const len = Math.sqrt(nx * nx + ny * ny) || 1;
  const off = Math.min(26, len * 0.12);
  const cx = mx + (nx / len) * off;
  const cy = my + (ny / len) * off;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function Panel({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section
      className="flex h-full min-h-0 flex-col rounded-2xl border p-4 lg:max-h-[392px]"
      style={{ background: "var(--panel)", borderColor: "var(--border)" }}
    >
      <div className="flex shrink-0 items-baseline justify-between gap-2">
        <h3 className="text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          {title}
        </h3>
        {count !== undefined && (
          <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--muted-2)" }}>
            {count}
          </span>
        )}
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border p-2" style={{ borderColor: `${color}33`, background: `${color}0F` }}>
      <div className="text-[17px] font-semibold leading-none" style={{ color: "var(--text-strong)" }}>
        {value}
      </div>
      <div className="mt-1 text-[9.5px] uppercase tracking-widest" style={{ color }}>
        {label}
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-0.5 w-4 rounded" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span>{label}</span>
    </div>
  );
}

// Role swatch — a hollow ring in the entity colour, mirroring the coloured ring
// the renderer now draws around every coin/exchange token on the canvas.
function LegendRing({ color, ringStroke, label }: { color: string; ringStroke?: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3.5 w-3.5 rounded-full"
        style={{
          background: color,
          border: `1.5px solid ${ringStroke ?? color}`,
          boxShadow: `0 0 6px ${(ringStroke ?? color)}90`,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

// A tiny logo chip for the legend — wraps a centred CoinLogo/ExchangeLogo in a
// self-contained <svg> viewport so it renders inline alongside its ticker.
function LogoChip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width={18} height={18} viewBox="-16 -16 32 32" className="shrink-0">
        {children}
      </svg>
      <span className="font-mono text-[11.5px]">{label}</span>
    </div>
  );
}
