"""The 18-feature extractor — parity with src/lib/graph-algorithms.ts extractOn().

Fourteen features reproduce the TypeScript formulas byte-for-byte (degree counts,
degree_ratio, USD sums, volume_retention, cadence/velocity, hops_to_mixer,
hops_to_vasp, balance_depletion, unique_counterparties). Two stay at the
prototype defaults that no detector populates (hops_to_sanctioned=0,
gas_parent_syndicate_size=1). The remaining FOUR — pagerank_score,
betweenness_centrality, community_size, local_clustering_coeff — are the GDS
features the TS fallback fakes with degree/reach; here they are computed for real
with NetworkX. FEATURE_NAMES order is load-bearing and matches the TS array.
"""

from __future__ import annotations

from typing import Any, Dict, List

import networkx as nx

from .graphcore import (
    Adjacency,
    canon,
    directed_hops_to_vasp,
    undirected_hops_to_mixer,
)

# Load-bearing order — identical to FEATURE_NAMES in graph-algorithms.ts:54.
FEATURE_NAMES: List[str] = [
    "in_degree",
    "out_degree",
    "degree_ratio",
    "total_inflow_usd",
    "total_outflow_usd",
    "volume_retention_ratio",
    "avg_tx_interval_seconds",
    "velocity_burst_score",
    "hops_to_mixer",
    "hops_to_sanctioned",
    "hops_to_vasp",
    "balance_depletion_rate",
    "gas_parent_syndicate_size",
    "unique_counterparties",
    "pagerank_score",
    "betweenness_centrality",
    "community_size",
    "local_clustering_coeff",
]

# Reproduced exactly (no detector populates these graph-side); see the TS header.
_HOPS_TO_SANCTIONED_DEFAULT = 0.0
_GAS_PARENT_SYNDICATE_DEFAULT = 1.0


def compute_gds(adj: Adjacency) -> Dict[str, Dict[str, float]]:
    """Real GDS on the built graph, keyed by canonical address.

    pagerank_score      — nx.pagerank(alpha=0.85), max-normalised to (0,1] so
                           Factor E's `>0.3` threshold stays meaningful.
    betweenness_centrality — nx.betweenness_centrality on the undirected
                           projection, normalised [0,1] (Factor F `>0.4`).
    community_size      — member count of the wallet's Louvain community.
    local_clustering_coeff — nx.clustering on the undirected projection.
    """
    nodes = list(adj.display.keys())
    empty = {n: 0.0 for n in nodes}
    if not nodes:
        return {"pagerank": {}, "betweenness": {}, "community_size": {}, "clustering": {}}

    dg = nx.DiGraph()
    dg.add_nodes_from(nodes)
    for frm, tos in adj.out_edges.items():
        for to in set(tos):  # simple edges for centrality (dedupe parallels)
            dg.add_edge(frm, to)
    ug = dg.to_undirected()

    # PageRank — only meaningful with flow; edgeless graph → all zero (matches
    # the TS approximation, where an isolated node scores 0).
    if dg.number_of_edges() > 0:
        try:
            pr = nx.pagerank(dg, alpha=0.85, max_iter=200, tol=1.0e-8)
            mx = max(pr.values()) or 1.0
            pagerank = {k: v / mx for k, v in pr.items()}
        except Exception:
            pagerank = dict(empty)
    else:
        pagerank = dict(empty)

    # Betweenness — needs at least 3 nodes to be non-trivial.
    if ug.number_of_nodes() > 2 and ug.number_of_edges() > 0:
        try:
            betweenness = nx.betweenness_centrality(ug, normalized=True)
        except Exception:
            betweenness = dict(empty)
    else:
        betweenness = dict(empty)

    # Clustering coefficient (undirected).
    try:
        clustering = nx.clustering(ug)
    except Exception:
        clustering = dict(empty)

    # Louvain community size — member count of each node's community.
    community_size: Dict[str, float] = {}
    try:
        communities = nx.community.louvain_communities(ug, seed=42)
        for comm in communities:
            size = float(len(comm))
            for n in comm:
                community_size[n] = size
    except Exception:
        community_size = {n: 1.0 for n in nodes}
    for n in nodes:
        community_size.setdefault(n, 1.0)

    return {
        "pagerank": pagerank,
        "betweenness": betweenness,
        "community_size": community_size,
        "clustering": clustering,
    }


def extract_features(adj: Adjacency, address: str, gds: Dict[str, Dict[str, float]]) -> Dict[str, float]:
    """Extract the 18-feature vector for one wallet (dict keyed by FEATURE_NAMES)."""
    c = canon(address)
    node: Any = adj.node_by_canon.get(c)

    in_list = adj.in_edges.get(c, [])
    out_list = adj.out_edges.get(c, [])
    in_degree = len(in_list)
    out_degree = len(out_list)
    in_vol = adj.in_usd.get(c, 0.0)
    out_vol = adj.out_usd.get(c, 0.0)

    # unique_counterparties sums two distinct-sets separately (a wallet that both
    # sends and receives is counted twice) — matches the TS/prototype exactly.
    unique_counterparties = len(set(in_list)) + len(set(out_list))

    volume_retention = 1.0
    depletion = 0.0
    if in_vol > 0:
        volume_retention = max(0.0, min(1.0, (in_vol - out_vol) / in_vol))
        balance = getattr(node, "balance_usd", None) if node is not None else None
        if (isinstance(balance, (int, float)) and balance <= 0) or out_vol >= in_vol * 0.95:
            depletion = 1.0

    # Cadence: first 20 timestamps ascending, mean of consecutive gaps (ms → s).
    avg_interval_seconds = 3600.0
    velocity = 0.0
    ts = sorted(adj.timestamps.get(c, []))[:20]
    if len(ts) > 1:
        total = sum(ts[i] - ts[i - 1] for i in range(1, len(ts)))
        avg_interval_seconds = total / (len(ts) - 1) / 1000.0
        if avg_interval_seconds < 120:
            velocity = 1.0
        elif avg_interval_seconds < 600:
            velocity = 0.75
        elif avg_interval_seconds < 3600:
            velocity = 0.4
        else:
            velocity = 0.1

    hops_mixer = undirected_hops_to_mixer(adj, address, 4)
    hops_vasp = directed_hops_to_vasp(adj, address, 5)

    return {
        "in_degree": float(in_degree),
        "out_degree": float(out_degree),
        "degree_ratio": out_degree / (in_degree + 1),
        "total_inflow_usd": float(in_vol),
        "total_outflow_usd": float(out_vol),
        "volume_retention_ratio": float(volume_retention),
        "avg_tx_interval_seconds": float(avg_interval_seconds),
        "velocity_burst_score": float(velocity),
        "hops_to_mixer": float(hops_mixer),
        "hops_to_sanctioned": _HOPS_TO_SANCTIONED_DEFAULT,
        "hops_to_vasp": float(hops_vasp),
        "balance_depletion_rate": float(depletion),
        "gas_parent_syndicate_size": _GAS_PARENT_SYNDICATE_DEFAULT,
        "unique_counterparties": float(unique_counterparties),
        # ── Real GDS (the upgrade over the TS fakes) ──
        "pagerank_score": float(gds["pagerank"].get(c, 0.0)),
        "betweenness_centrality": float(gds["betweenness"].get(c, 0.0)),
        "community_size": float(gds["community_size"].get(c, 1.0)),
        "local_clustering_coeff": float(gds["clustering"].get(c, 0.0)),
    }


def feature_vector(feats: Dict[str, float]) -> List[float]:
    """Flatten a feature dict into the ordered 18-float model input."""
    return [float(feats[name]) for name in FEATURE_NAMES]
