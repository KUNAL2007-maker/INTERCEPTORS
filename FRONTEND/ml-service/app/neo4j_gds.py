"""Optional Neo4j GDS backend for the four GDS features.

This is the *upgrade* path from Phase 5 of the plan. When NEO4J_URI + password are
configured AND a Neo4j server with the Graph Data Science plugin is reachable, we
project the current trace into an anonymous in-memory GDS graph and stream real
gds.pageRank / gds.betweenness / gds.louvain / gds.localClusteringCoefficient.

Every path is wrapped so that ANY failure — driver missing, server down, GDS
plugin absent, projection error — returns None, and the caller (main.compute_gds
_source) transparently falls back to the NetworkX implementation in features.py.
So this module is purely additive: with no Neo4j configured it is a clean no-op.

Note (honesty, per the plan): the victim→VASP PATH stays our own A* (astar.py).
gds.shortestPath.astar is geospatial-only (needs lat/long) and would be dishonest
here; GDS is used ONLY to compute the centrality/community features.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from . import config
from .graphcore import Adjacency

# A unique projection name per call avoids collisions if several requests overlap.
_PROJECTION_PREFIX = "cryptotrace_"


def compute_gds_neo4j(adj: Adjacency) -> Optional[Dict[str, Dict[str, float]]]:
    """Return the same dict shape as features.compute_gds, or None to fall back."""
    if not config.neo4j_available():
        return None
    try:
        from neo4j import GraphDatabase  # optional dependency, imported lazily
    except Exception:
        return None

    nodes = list(adj.display.keys())
    if not nodes:
        return None

    uri = config.neo4j_uri()
    user = config.neo4j_user()
    password = config.neo4j_password()
    graph_name = f"{_PROJECTION_PREFIX}{abs(hash(tuple(sorted(nodes)))) & 0xFFFFFFFF:x}"

    driver = None
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        with driver.session() as session:
            return _run_gds(session, adj, nodes, graph_name)
    except Exception:
        return None
    finally:
        if driver is not None:
            try:
                driver.close()
            except Exception:
                pass


def _run_gds(session: Any, adj: Adjacency, nodes: list[str], graph_name: str) -> Optional[Dict[str, Dict[str, float]]]:
    empty = {n: 0.0 for n in nodes}
    edges = [(frm, to) for frm, tos in adj.out_edges.items() for to in set(tos)]

    # Stage the trace as a scratch subgraph tagged with this projection name so we
    # can clean it up afterwards without touching any persisted forensic graph.
    try:
        session.run(
            "UNWIND $addrs AS a MERGE (n:_GdsScratch {addr: a, tag: $tag})",
            addrs=nodes,
            tag=graph_name,
        )
        if edges:
            session.run(
                """
                UNWIND $edges AS e
                MATCH (s:_GdsScratch {addr: e[0], tag: $tag})
                MATCH (t:_GdsScratch {addr: e[1], tag: $tag})
                MERGE (s)-[:_GDS_FLOW]->(t)
                """,
                edges=[[f, t] for f, t in edges],
                tag=graph_name,
            )

        session.run(
            """
            CALL gds.graph.project.cypher(
              $g,
              'MATCH (n:_GdsScratch {tag: $tag}) RETURN id(n) AS id',
              'MATCH (s:_GdsScratch {tag: $tag})-[:_GDS_FLOW]->(t:_GdsScratch {tag: $tag}) RETURN id(s) AS source, id(t) AS target',
              {parameters: {tag: $tag}}
            )
            """,
            g=graph_name,
            tag=graph_name,
        )

        pagerank = _stream_by_addr(
            session,
            f"CALL gds.pageRank.stream('{graph_name}', {{dampingFactor: 0.85}}) "
            "YIELD nodeId, score RETURN gds.util.asNode(nodeId).addr AS addr, score",
        )
        mx = max(pagerank.values()) if pagerank else 0.0
        pagerank = {k: (v / mx if mx > 0 else 0.0) for k, v in pagerank.items()}

        betweenness = _stream_by_addr(
            session,
            f"CALL gds.betweenness.stream('{graph_name}') "
            "YIELD nodeId, score RETURN gds.util.asNode(nodeId).addr AS addr, score",
        )
        # GDS betweenness is unnormalised; scale to [0,1] to match features.py.
        bmx = max(betweenness.values()) if betweenness else 0.0
        betweenness = {k: (v / bmx if bmx > 0 else 0.0) for k, v in betweenness.items()}

        clustering = _stream_by_addr(
            session,
            f"CALL gds.localClusteringCoefficient.stream('{graph_name}') "
            "YIELD nodeId, localClusteringCoefficient AS score "
            "RETURN gds.util.asNode(nodeId).addr AS addr, score",
        )

        community_ids = _stream_by_addr(
            session,
            f"CALL gds.louvain.stream('{graph_name}') "
            "YIELD nodeId, communityId AS score RETURN gds.util.asNode(nodeId).addr AS addr, score",
        )
        counts: Dict[float, int] = {}
        for cid in community_ids.values():
            counts[cid] = counts.get(cid, 0) + 1
        community_size = {addr: float(counts.get(cid, 1)) for addr, cid in community_ids.items()}

        return {
            "pagerank": {**empty, **pagerank},
            "betweenness": {**empty, **betweenness},
            "community_size": {n: community_size.get(n, 1.0) for n in nodes},
            "clustering": {**empty, **clustering},
        }
    except Exception:
        return None
    finally:
        try:
            session.run("CALL gds.graph.drop($g, false) YIELD graphName", g=graph_name)
        except Exception:
            pass
        try:
            session.run(
                "MATCH (n:_GdsScratch {tag: $tag}) DETACH DELETE n", tag=graph_name
            )
        except Exception:
            pass


def _stream_by_addr(session: Any, cypher: str) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for record in session.run(cypher):
        addr = record["addr"]
        if addr is not None:
            out[addr] = float(record["score"])
    return out
