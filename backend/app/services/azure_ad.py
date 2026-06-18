"""Validate Azure AD ID tokens (RS256, issued by Microsoft)."""
from __future__ import annotations

import logging
import os
from typing import Optional

import httpx
from jose import JWTError, jwt

logger = logging.getLogger(__name__)

TENANT_ID = os.getenv("AZURE_AD_TENANT_ID", "d1aec0dc-1c2b-4541-9724-3a6f21519d9e")
CLIENT_ID = os.getenv("AZURE_AD_CLIENT_ID", "0b7fb923-f379-4245-b319-a9c1725af4f5")

_JWKS_URL = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"
_ISSUER = f"https://login.microsoftonline.com/{TENANT_ID}/v2.0"

_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        resp = httpx.get(_JWKS_URL, timeout=10)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


def validate_azure_token(token: str) -> Optional[dict]:
    """Return the decoded payload if the token is a valid Azure AD token, else None."""
    try:
        jwks = _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=CLIENT_ID,
            issuer=_ISSUER,
        )
        return payload
    except JWTError as exc:
        logger.debug("azure_token_invalid: %s", exc)
        return None
    except Exception as exc:
        logger.warning("azure_token_validation_error: %s", exc)
        return None
