"""JWT issuance and verification.

Tokens are HS256-signed and short-ish (default 7 days). The secret comes from
the `JWT_SECRET` environment variable; if it's missing in development we fall
back to a noisy-and-insecure default so the server still boots, but log a
loud warning. **Production must set JWT_SECRET to a real 32+ byte random
string.**
"""

from __future__ import annotations

import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

logger = logging.getLogger(__name__)

_ALGO = "HS256"
_DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 7  # 7 days

_DEV_FALLBACK_SECRET = "dev-only-do-not-use-in-prod-" + secrets.token_hex(8)
_WARNED_ABOUT_DEFAULT = False


def _get_secret() -> str:
    global _WARNED_ABOUT_DEFAULT
    secret = os.getenv("JWT_SECRET")
    if secret:
        return secret
    if not _WARNED_ABOUT_DEFAULT:
        logger.warning(
            "jwt_secret_missing_using_dev_fallback",
            extra={"event": "jwt_secret_missing"},
        )
        _WARNED_ABOUT_DEFAULT = True
    return _DEV_FALLBACK_SECRET


def _expiry_seconds() -> int:
    raw = os.getenv("JWT_EXPIRES_SECONDS")
    if not raw:
        return _DEFAULT_EXPIRY_SECONDS
    try:
        return max(60, int(raw))
    except ValueError:
        return _DEFAULT_EXPIRY_SECONDS


def issue_token(subject_email: str) -> tuple[str, int]:
    """Return (jwt, expires_in_seconds) for the given user identity."""
    now = datetime.now(tz=timezone.utc)
    expires_in = _expiry_seconds()
    payload = {
        "sub": subject_email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
        "typ": "access",
    }
    token = jwt.encode(payload, _get_secret(), algorithm=_ALGO)
    return token, expires_in


def decode_token(token: str) -> Optional[dict]:
    """Return the JWT payload if valid, else None."""
    try:
        return jwt.decode(token, _get_secret(), algorithms=[_ALGO])
    except JWTError:
        return None
