from dotenv import load_dotenv

load_dotenv()

import logging
import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.dependencies.auth import require_user
from app.logging_setup import configure_logging
from app.middleware.request_id import RequestIdMiddleware
from app.rate_limit import limiter
from app.routers import (
    auth,
    business,
    loyalty,
    media_sales,
    outreach,
    sponsorships,
    team,
    tracker,
    volunteers,
)


# ─── Observability ───────────────────────────────────────────────────────────
configure_logging()
logger = logging.getLogger(__name__)

# Optional Sentry init — completely off unless SENTRY_DSN is set.
_sentry_dsn = os.getenv("SENTRY_DSN")
if _sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration

    sentry_sdk.init(
        dsn=_sentry_dsn,
        environment=os.getenv("APP_ENV", "production"),
        release=os.getenv("APP_VERSION", "0.2.0"),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.05")),
        integrations=[FastApiIntegration()],
        send_default_pii=False,
    )
    logger.info("sentry_enabled", extra={"event": "sentry_enabled"})


# ─── App ────────────────────────────────────────────────────────────────────
APP_VERSION = os.getenv("APP_VERSION", "0.2.0")
APP_ENV = os.getenv("APP_ENV", "development")

app = FastAPI(title="i3 Space API", version=APP_VERSION)
app.add_middleware(RequestIdMiddleware)


# ─── Rate limiting ───────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ─── CORS ────────────────────────────────────────────────────────────────────
# ALLOWED_ORIGINS env var is a comma-separated list; falls back to localhost for dev.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Cloudflare Pages preview deployments all land on *.pages.dev.
# ALLOW_PAGES_PREVIEWS is checked first; falls back to legacy ALLOW_VERCEL_PREVIEWS.
# Set to false once you have a stable custom domain.
_allow_pages = (
    os.getenv("ALLOW_PAGES_PREVIEWS", os.getenv("ALLOW_VERCEL_PREVIEWS", "true")).lower() == "true"
)
_origin_regex = r"https://.*\.pages\.dev" if _allow_pages else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)


# ─── Routers ─────────────────────────────────────────────────────────────────
# Auth router is public (login itself + /me, which uses its own guard).
app.include_router(auth.router)

# Every data router requires a valid bearer token.
_protected = [Depends(require_user)]
for r in (
    tracker.router,
    volunteers.router,
    loyalty.router,
    outreach.router,
    business.router,
    sponsorships.router,
    media_sales.router,
    team.router,
):
    app.include_router(r, dependencies=_protected)


# ─── Health & version ────────────────────────────────────────────────────────
@app.get("/healthz", tags=["meta"])
def healthz():
    """Structured health endpoint suitable for uptime checks."""
    return {
        "status": "ok",
        "version": APP_VERSION,
        "environment": APP_ENV,
    }


# Legacy alias — kept so existing UptimeRobot monitors and the Vercel pre-warm
# fetch keep working without re-configuration.
@app.get("/health", tags=["meta"], include_in_schema=False)
def health_legacy():
    return {"status": "ok"}


# ─── Startup banner ──────────────────────────────────────────────────────────
@app.on_event("startup")
def _startup_log():
    logger.info(
        "app_startup",
        extra={
            "event": "app_startup",
            "version": APP_VERSION,
            "environment": APP_ENV,
            "allowed_origins": _origins,
            "pages_previews_allowed": _allow_pages,
            "login_rate_limit": os.getenv("LOGIN_RATE_LIMIT", "5/minute"),
            "sentry_enabled": bool(_sentry_dsn),
        },
    )
