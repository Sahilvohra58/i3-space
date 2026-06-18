"""User credentials service backed by PostgreSQL."""
from __future__ import annotations

import logging
import os

import bcrypt

from app.database import SessionLocal
from app.orm_models import User

logger = logging.getLogger(__name__)

_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")


def _is_bcrypt(value: str) -> bool:
    return value.startswith(_BCRYPT_PREFIXES)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_credentials(email: str, password: str) -> bool:
    with SessionLocal() as session:
        user = session.query(User).filter(User.email == email.strip().lower()).first()
    if not user:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))
    except ValueError:
        return False


def seed_initial_user() -> None:
    """Create the first admin user from env vars if the users table is empty."""
    email = os.getenv("INITIAL_USER_EMAIL", "").strip().lower()
    password = os.getenv("INITIAL_USER_PASSWORD", "").strip()
    if not email or not password:
        return
    with SessionLocal() as session:
        if session.query(User).count() == 0:
            user = User(email=email, password_hash=hash_password(password))
            session.add(user)
            session.commit()
            logger.info("initial_user_seeded", extra={"event": "initial_user_seeded", "email": email})
