"""SQLAlchemy engine and session configuration."""
from __future__ import annotations

import os

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def _build_engine(database: str = "i3space"):
    raw = os.environ["DATABASE_URL"]
    # Strip any existing db name and append the target one
    base = raw.rsplit("/", 1)[0]
    # Strip trailing query params from base if present
    if "?" in base:
        base = base.split("?")[0]
    suffix = raw.rsplit("/", 1)[-1]
    # Preserve existing query params from the original URL
    params = ("?" + suffix.split("?", 1)[1]) if "?" in suffix else "?sslmode=require"
    url = f"{base}/{database}{params}"
    return create_engine(url, pool_pre_ping=True)


def ensure_database_exists() -> None:
    """Create the i3space database if it does not exist."""
    raw = os.environ["DATABASE_URL"]
    base = raw.rsplit("/", 1)[0]
    if "?" in base:
        base = base.split("?")[0]
    suffix = raw.rsplit("/", 1)[-1]
    params = ("?" + suffix.split("?", 1)[1]) if "?" in suffix else "?sslmode=require"
    admin_url = f"{base}/postgres{params}"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = 'i3space'")
        ).fetchone()
        if not exists:
            conn.execute(text("CREATE DATABASE i3space"))
    admin_engine.dispose()


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
