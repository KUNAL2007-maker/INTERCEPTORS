"""Feature-extraction parity + GDS sanity.

The 14 non-GDS features are hand-computed against a fixed 5-node graph and must
match app.features exactly (this is the TypeScript-parity contract). The 4 GDS
features are only range-checked, since they are the real-NetworkX upgrade over
the TS approximations and legitimately differ."""

import math

from app.features import extract_features
from app.graphcore import build_adjacency, canon
from app.schemas import VaspAttribution, WalletNodeIn, WalletTransferIn

A = "0x" + "a" * 40  # victim
B = "0x" + "b" * 40  # mule (unit under test)
C = "0x" + "c" * 40  # peel / bridge
V = "0x" + "d" * 40  # verified VASP
M = "0x" + "e" * 40  # mixer


def _fixed_graph():
    nodes = [
        WalletNodeIn(address=A, layer_type="VICTIM_SOURCE", balance_usd=0.0),
        WalletNodeIn(address=B, layer_type="MULE", balance_usd=0.0),
        WalletNodeIn(address=C, layer_type="PEELING_CHAIN", balance_usd=0.0),
        WalletNodeIn(
            address=V,
            layer_type="EXCHANGE",
            balance_usd=900.0,
            vasp_attribution=VaspAttribution(vasp_name="Demo", is_verified=True, is_mixer=False, compliance_email="le@demo"),
        ),
        WalletNodeIn(address=M, layer_type="MIXER", vasp_attribution=VaspAttribution(is_mixer=True)),
    ]
    transfers = [
        WalletTransferIn(from_address=A, to_address=B, value_usd=1000.0, timestamp=0.0),
        WalletTransferIn(from_address=B, to_address=C, value_usd=950.0, timestamp=60_000.0),
        WalletTransferIn(from_address=C, to_address=V, value_usd=900.0, timestamp=120_000.0),
        WalletTransferIn(from_address=C, to_address=M, value_usd=10.0, timestamp=120_000.0),
    ]
    return nodes, transfers


def test_canon_evm_lowercased_tron_untouched():
    assert canon("0x" + "AbC" + "0" * 37) == "0x" + "abc" + "0" * 37
    assert canon("TJRabc123XYZ") == "TJRabc123XYZ"  # base58 TRON left as-is


def test_non_gds_feature_parity_on_mule():
    nodes, transfers = _fixed_graph()
    adj = build_adjacency(nodes, transfers)
    from app.features import compute_gds

    f = extract_features(adj, B, compute_gds(adj))

    assert f["in_degree"] == 1.0
    assert f["out_degree"] == 1.0
    assert f["degree_ratio"] == 0.5  # 1 / (1 + 1)
    assert f["total_inflow_usd"] == 1000.0
    assert f["total_outflow_usd"] == 950.0
    assert math.isclose(f["volume_retention_ratio"], 0.05, rel_tol=1e-9, abs_tol=1e-9)
    assert f["balance_depletion_rate"] == 1.0  # 950 >= 1000 * 0.95
    assert f["avg_tx_interval_seconds"] == 60.0  # gap 60_000 ms -> 60 s
    assert f["velocity_burst_score"] == 1.0  # < 120 s
    assert f["hops_to_mixer"] == 2.0  # B - C - M (undirected)
    assert f["hops_to_vasp"] == 2.0  # B -> C -> V (directed)
    assert f["unique_counterparties"] == 2.0  # {A} + {C}
    assert f["hops_to_sanctioned"] == 0.0  # unpopulated default
    assert f["gas_parent_syndicate_size"] == 1.0  # unpopulated default


def test_gds_features_are_real_and_in_range():
    nodes, transfers = _fixed_graph()
    adj = build_adjacency(nodes, transfers)
    from app.features import compute_gds

    gds = compute_gds(adj)
    f = extract_features(adj, C, gds)

    assert 0.0 <= f["pagerank_score"] <= 1.0
    assert 0.0 <= f["betweenness_centrality"] <= 1.0
    assert f["community_size"] >= 1.0
    assert 0.0 <= f["local_clustering_coeff"] <= 1.0
    # C forwards to two distinct sinks, so it carries real PageRank mass.
    assert f["pagerank_score"] > 0.0


def test_isolated_wallet_defaults():
    """A wallet with no transfers gets the clean defaults (retention 1, no sweep,
    default cadence), matching the TS extractor."""
    nodes = [WalletNodeIn(address=A, layer_type="P2P_USER", balance_usd=500.0)]
    adj = build_adjacency(nodes, [])
    from app.features import compute_gds

    f = extract_features(adj, A, compute_gds(adj))
    assert f["in_degree"] == 0.0
    assert f["out_degree"] == 0.0
    assert f["volume_retention_ratio"] == 1.0
    assert f["balance_depletion_rate"] == 0.0
    assert f["avg_tx_interval_seconds"] == 3600.0
    assert f["velocity_burst_score"] == 0.0
    assert f["pagerank_score"] == 0.0  # edgeless graph
