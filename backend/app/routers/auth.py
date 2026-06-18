import logging

from fastapi import APIRouter, Depends

from app.dependencies.auth import require_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def me(user: dict = Depends(require_user)):
    """Lightweight token validation check — returns user identity from Azure AD token."""
    return {
        "email": user.get("preferred_username") or user.get("upn") or user.get("email"),
        "name": user.get("name"),
        "oid": user.get("oid"),
    }
