"""Environment-driven configuration. Secrets are read from the environment ONLY
and never logged — mirroring the Next.js app's discipline (see .env.example).
"""

from __future__ import annotations

import os


def neo4j_uri() -> str | None:
    return os.environ.get("NEO4J_URI") or None


def neo4j_user() -> str:
    return os.environ.get("NEO4J_USER", "neo4j")


def neo4j_password() -> str | None:
    return os.environ.get("NEO4J_PASSWORD") or None


def neo4j_available() -> bool:
    """True only when a URI AND password are present. The GDS path still guards
    every call with try/except and falls back to NetworkX, so this is a hint,
    not a guarantee."""
    return bool(neo4j_uri() and neo4j_password())


def model_path() -> str:
    """Path to the committed XGBoost model. Overridable via MODEL_PATH."""
    override = os.environ.get("MODEL_PATH")
    if override:
        return override
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(here, "models", "xgb_model.json")
