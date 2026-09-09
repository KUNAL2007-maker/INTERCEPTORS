"""A* correctness: optimality (matches BFS shortest hop-count to a serviceable
VASP), admissibility of the landmark heuristic (h <= true remaining), the g/h/f
per-node contract, and graceful None when unreachable."""

import random

from app.astar import astar_path_to_vasp
from app.graphcore import build_adjacency, canon, directed_hops_to_vasp
from app.schemas import VaspAttribution, WalletNodeIn, WalletTransferIn


def _addr(i: int) -> str:
    return "0x" + f"{i:040x}"


def _verified_vasp(addr: str) -> WalletNodeIn:
    return WalletNodeIn(
        address=addr,
        layer_type="EXCHANGE",
        vasp_attribution=VaspAttribution(vasp_name="Demo", is_verified=True, is_mixer=False, compliance_email="le@demo"),
    )


def _linear_graph():
    a, b, c, v = _addr(1), _addr(2), _addr(3), _addr(4)
    nodes = [
        WalletNodeIn(address=a, layer_type="VICTIM_SOURCE"),
        WalletNodeIn(address=b, layer_type="MULE"),
        WalletNodeIn(address=c, layer_type="PEELING_CHAIN"),
        _verified_vasp(v),
    ]
    transfers = [
        WalletTransferIn(from_address=a, to_address=b, value_usd=100.0, timestamp=0.0),
        WalletTransferIn(from_address=b, to_address=c, value_usd=90.0, timestamp=1000.0),
        WalletTransferIn(from_address=c, to_address=v, value_usd=80.0, timestamp=2000.0),
    ]
    return a, b, c, v, nodes, transfers


def test_astar_finds_optimal_path():
    a, b, c, v, nodes, transfers = _linear_graph()
    adj = build_adjacency(nodes, transfers)
    result = astar_path_to_vasp(adj, a)

    assert result is not None
    assert result["path"] == [a, b, c, v]
    assert result["hops"] == 3
    assert result["vasp"]["verified"] is True

    per = result["perNode"]
    # g increases 0..3, h decreases 3..0, f == 3 everywhere (consistent heuristic).
    assert [p["g"] for p in per] == [0.0, 1.0, 2.0, 3.0]
    assert [p["h"] for p in per] == [3.0, 2.0, 1.0, 0.0]
    assert all(abs(p["f"] - 3.0) < 1e-9 for p in per)


def test_astar_none_when_no_serviceable_vasp():
    a, b, c, v, nodes, transfers = _linear_graph()
    # Demote the VASP to a mixer -> not serviceable -> no reachable goal.
    nodes[-1] = WalletNodeIn(address=v, layer_type="MIXER", vasp_attribution=VaspAttribution(is_mixer=True))
    adj = build_adjacency(nodes, transfers)
    assert astar_path_to_vasp(adj, a) is None


def test_astar_none_when_seed_absent():
    _, _, _, _, nodes, transfers = _linear_graph()
    adj = build_adjacency(nodes, transfers)
    assert astar_path_to_vasp(adj, _addr(999)) is None


def test_astar_optimality_matches_bfs_on_random_graphs():
    """On random graphs with a reachable VASP, A*'s hop count must equal the
    independent directed BFS shortest hop-count (proves optimality + admissibility
    together — an inadmissible h could return a longer path)."""
    rng = random.Random(7)
    checked = 0
    for _ in range(60):
        n = rng.randint(5, 14)
        addrs = [_addr(i + 1) for i in range(n)]
        vasp_idx = rng.randrange(n)
        nodes = []
        for i, addr in enumerate(addrs):
            if i == vasp_idx:
                nodes.append(_verified_vasp(addr))
            else:
                nodes.append(WalletNodeIn(address=addr, layer_type="MULE"))
        transfers = []
        for _e in range(rng.randint(n, n * 2)):
            s, t = rng.randrange(n), rng.randrange(n)
            if s != t:
                transfers.append(
                    WalletTransferIn(from_address=addrs[s], to_address=addrs[t], value_usd=float(rng.randint(1, 1000)), timestamp=float(_e * 1000))
                )
        adj = build_adjacency(nodes, transfers)
        seed = addrs[rng.randrange(n)]
        result = astar_path_to_vasp(adj, seed)
        bfs_hops = directed_hops_to_vasp(adj, seed, max_hops=12)
        if result is None:
            # A* found no path -> BFS must agree there is none within range.
            assert bfs_hops == 0
        else:
            assert result["hops"] == bfs_hops
            # Every node's f never exceeds the optimal cost (consistency).
            assert all(p["f"] <= result["hops"] + 1e-9 for p in result["perNode"])
            checked += 1
    assert checked > 0  # at least some random graphs had a reachable VASP
