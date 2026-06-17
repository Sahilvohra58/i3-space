import logging
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from app.dependencies.auth import require_user
from app.models.auth import LoginRequest, LoginResponse
from app.rate_limit import limiter
from app.services.jwt_service import issue_token
from app.services.sheets import verify_credentials

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

_LOGIN_RATE = os.getenv("LOGIN_RATE_LIMIT", "5/minute")


@router.post("/login", response_model=LoginResponse)
@limiter.limit(_LOGIN_RATE)
def login(request: Request, payload: LoginRequest):
    email = payload.email.lower()
    try:
        found = verify_credentials(email, payload.password)
    except Exception as exc:
        logger.exception("login_credentials_store_error", extra={"event": "login_error"})
        raise HTTPException(
            status_code=500,
            detail=f"Could not reach credentials store: {exc}",
        )

    if not found:
        logger.info(
            "login_failed",
            extra={"event": "login_failed", "email": email},
        )
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": "Invalid credentials"},
        )

    token, expires_in = issue_token(subject_email=email)
    logger.info(
        "login_succeeded",
        extra={"event": "login_succeeded", "email": email, "expires_in": expires_in},
    )
    return {
        "success": True,
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": expires_in,
        "email": email,
    }


@router.get("/me")
def me(user: dict = Depends(require_user)):
    """Lightweight 'is my token still valid?' check the frontend can call on mount."""
    return {"email": user.get("sub"), "expires_at": user.get("exp")}
