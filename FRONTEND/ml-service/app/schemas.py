"""Request/response contracts for the sidecar.

Field names mirror the app's domain types (src/lib/domain.ts): WalletNode uses
`address`, `balance_usd`, `layer_type`, `vasp_attribution{vasp_name, is_verified,
is_mixer, compliance_email}`; WalletTransfer uses `from_address`, `to_address`,
`value_usd`, `timestamp` (ms epoch). `extra="ignore"` so the Next.js route can
send richer objects without breaking us.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class VaspAttribution(BaseModel):
    model_config = ConfigDict(extra="ignore")
    vasp_name: Optional[str] = None
    is_verified: Optional[bool] = None
    is_mixer: Optional[bool] = None
    compliance_email: Optional[str] = None


class WalletNodeIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    address: str
    chain: Optional[str] = None
    balance_usd: Optional[float] = None
    layer_type: Optional[str] = None
    vasp_attribution: Optional[VaspAttribution] = None


class WalletTransferIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    from_address: str
    to_address: str
    chain: Optional[str] = None
    value_usd: Optional[float] = 0.0
    timestamp: Optional[float] = None  # ms epoch, matching the tracer


class AnalyzeRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    nodes: List[WalletNodeIn] = Field(default_factory=list)
    transfers: List[WalletTransferIn] = Field(default_factory=list)
    seed: str


# ── Response ──────────────────────────────────────────────────────────────────


class AstarPerNode(BaseModel):
    address: str
    g: float  # hops walked from the seed (unit edge cost)
    h: float  # admissible remaining hops to the nearest serviceable VASP
    f: float  # g + h


class AstarVasp(BaseModel):
    address: str
    name: Optional[str] = None
    compliance_email: Optional[str] = None
    verified: bool = False


class AstarPath(BaseModel):
    path: List[str]
    perNode: List[AstarPerNode]
    hops: int
    vasp: AstarVasp
    explanation: str


class WalletResult(BaseModel):
    address: str
    features: Dict[str, float]
    fraud_probability: Optional[float] = None  # 0–100, or null if model absent


class AnalyzeResponse(BaseModel):
    perWallet: List[WalletResult]
    astarPathToVasp: Optional[AstarPath] = None
    gdsSource: str  # "networkx" | "neo4j-gds"
    mlSource: str  # "python-xgboost" | "features-only"
    modelKind: str  # "synthetic-demo" | "none"
    featureNames: List[str]
