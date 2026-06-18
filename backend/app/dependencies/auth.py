"""FastAPI auth dependency.

Usage in a router:

    from app.dependencies.auth import require_user

    @router.get("/something", dependencies=[Depends(require_user)])
    def something(): ...

    # or, to also receive the user identity inside the handler:
    @router.get("/whoami")
    def whoami(user: dict = Depends(require_user)):
        return user
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.azure_ad import validate_azure_token


_bearer = HTTPBearer(auto_error=False, description="Azure AD Bearer token")


def require_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    """Validate the Authorization header and return the Azure AD token payload."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = validate_azure_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
