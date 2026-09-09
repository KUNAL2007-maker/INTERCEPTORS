"""Real A* path-finding — f = g + h — over the already-built trace graph.

This is the genuine "A*" deliverable. It runs on the graph the discovery walk
already materialised, so unlike the discovery walk (honest best-first BFS, which
cannot know where the VASP is until it finds it), here the goal set IS known: the
serviceable VASPs. That is exactly the setting where A* applies.

  g(n) — hops walked from the seed. Unit edge cost (1), so g is integer hop depth.
  h(n) — ADMISSIBLE landmark heuristic: the minimum remaining hops from n to ANY
         serviceable VASP, precomputed by a reverse multi-source BFS over the
         reversed graph. With unit edge cost this equals the true remaining cost,
         hence it is admissible AND consistent (monotone) ⇒ A* is provably optimal
         and defensible under cross-examination.
  promise — large fund share / sweep / suspicious layer. Used ONLY as the equal-f
         tie-breaker (and frontier bias), NEVER added into h, so admissibility is
         preserved. This is the stakeholder's "prioritise the promising path."

"Serviceable VASP" = is_verified && !is_mixer, matching graph-algorithms.ts.
Returns None when the seed is absent or no VASP is reachable.
"""

from __future__ import annotations

import heapq
from collections import deque
from typing import Any, Dict, List, Optional

from .graphcore import Adjacency, canon, is_serviceable_vasp

_SUSPICIOUS_LAYER_HINTS = ("PEEL", "MULE", "BRIDGE", "MIXER", "HOP", "DEPOSIT", "LAYER")
_MAX_HOPS = 12  # safety bound; real traces are <= 5 hops from the seed


def _serviceable_targets(adj: Adjacency) -> List[str]:
    return [c for c, node in adj.node_by_canon.items() if is_serviceable_vasp(node)]


def _reverse_bfs_min_hops(adj: Adjacency, targets: List[str]) -> Dict[str, int]:
    """h(n) for every node: min forward hops from n to the nearest target.

    Computed by BFS over the REVERSED graph seeded from all targets at once —
    reversing directed edges means we walk predecessors (in_edges), so reaching n
    at depth d proves n can reach some target in d forward hops. Nodes absent from
    the result are unreachable (h = +inf)."""
    dist: Dict[str, int] = {t: 0 for t in targets}
    q: deque[str] = deque(targets)
    while q:
        cur = q.popleft()
        d = dist[cur]
        for pred in adj.in_edges.get(cur, []):  # reversed edge
            if pred not in dist:
                dist[pred] = d + 1
                q.append(pred)
    return dist


def _compute_promise(adj: Adjacency) -> Dict[str, float]:
    """Tie-breaker bias in [0, ~1.8]: normalised throughput + sweep + suspicious
    layer. Never enters the cost function — only orders equal-f frontier nodes."""
    max_usd = 1.0
    for c in adj.display:
        vol = adj.out_usd.get(c, 0.0) + adj.in_usd.get(c, 0.0)
        if vol > max_usd:
            max_usd = vol

    promise: Dict[str, float] = {}
    for c in adj.display:
        in_v = adj.in_usd.get(c, 0.0)
        out_v = adj.out_usd.get(c, 0.0)
        vol_share = (in_v + out_v) / max_usd
        sweep = 1.0 if in_v > 0 and out_v >= in_v * 0.95 else 0.0
        node = adj.node_by_canon.get(c)
        layer = (getattr(node, "layer_type", None) or "") if node is not None else ""
        susp = 1.0 if any(h in str(layer).upper() for h in _SUSPICIOUS_LAYER_HINTS) else 0.0
        promise[c] = vol_share + 0.5 * sweep + 0.3 * susp
    return promise


def _build_result(
    adj: Adjacency,
    came_from: Dict[str, Optional[str]],
    g: Dict[str, int],
    h: Dict[str, int],
    goal: str,
) -> Dict[str, Any]:
    chain: List[str] = []
    cur: Optional[str] = goal
    while cur is not None:
        chain.append(cur)
        cur = came_from.get(cur)
    chain.reverse()

    per_node = []
    for c in chain:
        gc = float(g.get(c, 0))
        hc = float(h.get(c, 0))
        per_node.append({"address": adj.display.get(c, c), "g": gc, "h": hc, "f": gc + hc})

    vnode = adj.node_by_canon.get(goal)
    vasp_attr = getattr(vnode, "vasp_attribution", None) if vnode is not None else None
    vasp_name = getattr(vasp_attr, "vasp_name", None) if vasp_attr else None
    hops = int(g.get(goal, len(chain) - 1))

    explanation = (
        f"A* expanded from the victim seed using f = g + h, where g is the hops "
        f"walked and h is the admissible minimum remaining hops to any serviceable "
        f"VASP (reverse-BFS landmark, unit edge cost => optimal). Selected the "
        f"optimal {hops}-hop cash-out path to {vasp_name or 'the exchange'}; "
        f"equal-f frontier nodes were ordered by fund-flow promise."
    )

    return {
        "path": [adj.display.get(c, c) for c in chain],
        "perNode": per_node,
        "hops": hops,
        "vasp": {
            "address": getattr(vnode, "address", adj.display.get(goal, goal)),
            "name": vasp_name,
            "compliance_email": getattr(vasp_attr, "compliance_email", None) if vasp_attr else None,
            "verified": bool(getattr(vasp_attr, "is_verified", False)) if vasp_attr else False,
        },
        "explanation": explanation,
    }


def astar_path_to_vasp(adj: Adjacency, seed: str, max_hops: int = _MAX_HOPS) -> Optional[Dict[str, Any]]:
    start = canon(seed)
    if start not in adj.display:
        return None
    targets = _serviceable_targets(adj)
    if not targets:
        return None

    h = _reverse_bfs_min_hops(adj, targets)
    if start not in h:  # seed cannot reach any serviceable VASP
        return None

    promise = _compute_promise(adj)
    inf = float("inf")

    def hn(n: str) -> float:
        return float(h.get(n, inf))

    g: Dict[str, int] = {start: 0}
    came_from: Dict[str, Optional[str]] = {start: None}
    closed: set[str] = set()
    counter = 0
    # (f, -promise, insertion_order, node): promise breaks equal-f ties toward the
    # more suspicious frontier; insertion_order keeps the heap total-ordered.
    open_heap: List[tuple] = [(hn(start), -promise.get(start, 0.0), counter, start)]

    while open_heap:
        _f, _negp, _ord, cur = heapq.heappop(open_heap)
        if cur in closed:
            continue
        closed.add(cur)
        g_cur = g[cur]

        # Goal test on pop: with a consistent h, the first serviceable VASP popped
        # (g >= 1, mirroring hopsToVaspDirected) is reached by an optimal path.
        if g_cur >= 1 and is_serviceable_vasp(adj.node_by_canon.get(cur)):
            return _build_result(adj, came_from, g, h, cur)
        if g_cur >= max_hops:
            continue

        for nb in set(adj.out_edges.get(cur, [])):
            ng = g_cur + 1
            if nb not in g or ng < g[nb]:
                g[nb] = ng
                came_from[nb] = cur
                counter += 1
                heapq.heappush(open_heap, (ng + hn(nb), -promise.get(nb, 0.0), counter, nb))

    return None
