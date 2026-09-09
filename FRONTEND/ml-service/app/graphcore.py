"""Address canonicalisation + adjacency + BFS helpers.

A faithful Python port of the corresponding logic in
src/lib/graph-algorithms.ts (canon, buildAdjacency, hopsToMixer,
hopsToVaspDirected, isMixer, isServiceableVasp). Keeping these byte-for-byte
identical is what lets the sidecar's 14 non-GDS features match the TypeScript
fallback exactly; only the 4 GDS features (pagerank, betweenness, community,
clustering) legitimately differ, because here they are computed for real.
"""

from __future__ import annotations

import math
import re
from collections import defaultdict, deque
from typing import Any, Iterable

# EVM addresses (0x + 40 hex) are case-insensitive → lowercased for matching.
# TRON (T…) and Bitcoin addresses are case-SENSITIVE and left untouched.
_EVM_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")


def canon(address: str | None) -> str:
    a = address or ""
    return a.lower() if _EVM_RE.match(a) else a


def _num(x: Any) -> float | None:
    """Return a finite float or None (mirrors JS Number.isFinite gating)."""
    if x is None:
        return None
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if math.isfinite(v) else None


class Adjacency:
    __slots__ = (
        "display",
        "node_by_canon",
        "out_edges",
        "in_edges",
        "undirected",
        "out_usd",
        "in_usd",
        "timestamps",
    )

    def __init__(self) -> None:
        self.display: dict[str, str] = {}
        self.node_by_canon: dict[str, Any] = {}
        self.out_edges: dict[str, list[str]] = defaultdict(list)
        self.in_edges: dict[str, list[str]] = defaultdict(list)
        self.undirected: dict[str, set[str]] = defaultdict(set)
        self.out_usd: dict[str, float] = defaultdict(float)
        self.in_usd: dict[str, float] = defaultdict(float)
        self.timestamps: dict[str, list[float]] = defaultdict(list)


def build_adjacency(nodes: Iterable[Any], transfers: Iterable[Any]) -> Adjacency:
    """Build the shared adjacency once. Self-loops (from == to) are ignored for
    edges but their timestamp still counts, matching the TS layout engine."""
    adj = Adjacency()

    for n in nodes:
        c = canon(n.address)
        adj.display[c] = n.address
        adj.node_by_canon[c] = n

    for t in transfers:
        frm = canon(t.from_address)
        to = canon(t.to_address)
        if frm not in adj.display:
            adj.display[frm] = t.from_address
        if to not in adj.display:
            adj.display[to] = t.to_address

        usd = _num(getattr(t, "value_usd", None)) or 0.0
        ts = _num(getattr(t, "timestamp", None))
        if ts is not None:
            adj.timestamps[frm].append(ts)
            if to != frm:
                adj.timestamps[to].append(ts)

        if frm == to:
            continue  # ignore self-loops, as the layout engine does

        adj.out_edges[frm].append(to)
        adj.in_edges[to].append(frm)
        adj.undirected[frm].add(to)
        adj.undirected[to].add(frm)
        adj.out_usd[frm] += usd
        adj.in_usd[to] += usd

    return adj


def is_mixer(node: Any) -> bool:
    v = getattr(node, "vasp_attribution", None) if node is not None else None
    return bool(v and getattr(v, "is_mixer", None) is True)


def is_serviceable_vasp(node: Any) -> bool:
    v = getattr(node, "vasp_attribution", None) if node is not None else None
    return bool(v and getattr(v, "is_verified", None) is True and getattr(v, "is_mixer", None) is not True)


def directed_hops_to_vasp(adj: Adjacency, frm: str, max_hops: int = 5) -> int:
    """Directed shortest hop-count to the nearest serviceable VASP, 0 == none.
    Mirrors hopsToVaspDirected (d >= 1 required)."""
    start = canon(frm)
    if start not in adj.display:
        return 0
    dist = {start: 0}
    q: deque[str] = deque([start])
    while q:
        cur = q.popleft()
        d = dist[cur]
        if d >= 1 and is_serviceable_vasp(adj.node_by_canon.get(cur)):
            return d
        if d >= max_hops:
            continue
        for nb in adj.out_edges.get(cur, []):
            if nb not in dist:
                dist[nb] = d + 1
                q.append(nb)
    return 0


def undirected_hops_to_mixer(adj: Adjacency, frm: str, max_hops: int = 4) -> int:
    """Undirected shortest hop-count to the nearest mixer, 0 == none.
    Mirrors hopsToMixer (d >= 1 required)."""
    start = canon(frm)
    if start not in adj.display:
        return 0
    dist = {start: 0}
    q: deque[str] = deque([start])
    while q:
        cur = q.popleft()
        d = dist[cur]
        if d >= 1 and is_mixer(adj.node_by_canon.get(cur)):
            return d
        if d >= max_hops:
            continue
        for nb in adj.undirected.get(cur, set()):
            if nb not in dist:
                dist[nb] = d + 1
                q.append(nb)
    return 0
