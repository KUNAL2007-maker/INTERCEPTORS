"""Model sanity: the committed booster loads, predicts on the 0–100 scale, and
ranks a laundering mule far above an ordinary retained-balance wallet."""

from app import model
from app.features import compute_gds, extract_features, feature_vector
from app.graphcore import build_adjacency
from app.schemas import VaspAttribution, WalletNodeIn, WalletTransferIn


def _score(nodes, transfers, addr):
    adj = build_adjacency(nodes, transfers)
    feats = extract_features(adj, addr, compute_gds(adj))
    return model.predict_fraud([feature_vector(feats)])[0]


def test_model_loads():
    assert model.model_loaded() is True


def test_illicit_scores_higher_than_clean():
    victim = "0x" + "1" * 40
    collector = "0x" + "2" * 40
    mule = "0x" + "3" * 40
    deposit = "0x" + "4" * 40
    vasp = "0x" + "5" * 40
    illicit_nodes = [
        WalletNodeIn(address=victim, layer_type="VICTIM_SOURCE", balance_usd=0.0),
        WalletNodeIn(address=collector, layer_type="COLLECTOR", balance_usd=0.0),
        WalletNodeIn(address=mule, layer_type="MULE", balance_usd=0.0),
        WalletNodeIn(address=deposit, layer_type="VASP_DEPOSIT", balance_usd=0.0),
        WalletNodeIn(address=vasp, layer_type="EXCHANGE", balance_usd=9000.0, vasp_attribution=VaspAttribution(vasp_name="Demo", is_verified=True, is_mixer=False, compliance_email="le@demo")),
    ]
    illicit_tx = [
        WalletTransferIn(from_address=victim, to_address=collector, value_usd=10000.0, timestamp=0.0),
        WalletTransferIn(from_address=collector, to_address=mule, value_usd=9900.0, timestamp=50_000.0),
        WalletTransferIn(from_address=mule, to_address=deposit, value_usd=9800.0, timestamp=100_000.0),
        WalletTransferIn(from_address=deposit, to_address=vasp, value_usd=9700.0, timestamp=150_000.0),
    ]
    mule_score = _score(illicit_nodes, illicit_tx, mule)

    # Clean: a retained-balance wallet receiving slowly over days.
    hub = "0x" + "6" * 40
    cust = "0x" + "7" * 40
    hour = 3_600_000
    clean_nodes = [
        WalletNodeIn(address=hub, layer_type="MERCHANT", balance_usd=8000.0),
        WalletNodeIn(address=cust, layer_type="P2P_USER", balance_usd=2000.0),
    ]
    clean_tx = [WalletTransferIn(from_address=cust, to_address=hub, value_usd=1200.0, timestamp=float(3 * hour))]
    hub_score = _score(clean_nodes, clean_tx, hub)

    assert mule_score is not None and hub_score is not None
    assert 0.0 <= hub_score <= 100.0
    assert 0.0 <= mule_score <= 100.0
    assert mule_score > hub_score
    assert mule_score > 60.0  # a clear laundering mule reads as high risk
