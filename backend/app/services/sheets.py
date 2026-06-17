"""User-credentials service backed by Google Sheets.

Users live in the `Sheet1` tab of the configured spreadsheet:

| A (email)              | B (password)                                     |
|------------------------|--------------------------------------------------|
| user@example.com       | $2b$12$...bcrypt hash...                         |
| legacy@example.com     | plaintext-password   (← supported only during    |
|                        |                          migration, see below)   |

The verifier accepts both bcrypt hashes (preferred) and plaintext passwords
(legacy). Plaintext acceptance is a *bridge* so the app keeps working before,
during, and immediately after `scripts/migrate_passwords.py` is run; once every
row has been hashed, the plaintext path is effectively unreachable.

Writes (e.g. the migrator) go through the **service-account** client. Reads
also use the service account, removing the previous reliance on a public-share
+ API-key flow.
"""

from __future__ import annotations

import os
import logging
from functools import lru_cache
from typing import Optional

import bcrypt
import gspread

from app.services.tracker_sheets import _get_client


logger = logging.getLogger(__name__)

_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")


@lru_cache(maxsize=1)
def _users_sheet() -> gspread.Worksheet:
    spreadsheet_id = os.environ["SPREADSHEET_ID"]
    sheet_name = os.getenv("SHEET_NAME", "Sheet1")
    return _get_client().open_by_key(spreadsheet_id).worksheet(sheet_name)


def hash_password(plain: str) -> str:
    """Return a bcrypt hash (default cost 12) suitable for storage."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def _is_bcrypt(value: str) -> bool:
    return value.startswith(_BCRYPT_PREFIXES)


def _check_password(plain: str, stored: str) -> bool:
    """Constant-time compare. Tolerates bcrypt hashes and legacy plaintext."""
    if not stored:
        return False
    if _is_bcrypt(stored):
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), stored.encode("utf-8"))
        except ValueError:
            return False
    # Legacy plaintext compare (bridge only). Surface a warning so it's obvious
    # in logs that a migration is overdue.
    logger.warning(
        "plaintext_password_compare",
        extra={"event": "plaintext_password_compare"},
    )
    return stored == plain


def verify_credentials(email: str, password: str) -> bool:
    """Return True if (email, password) matches a row in the users sheet."""
    rows = _users_sheet().get_all_values()
    email_norm = email.strip().lower()
    for row in rows:
        if len(row) < 2:
            continue
        row_email = (row[0] or "").strip().lower()
        if row_email == email_norm:
            return _check_password(password, row[1] or "")
    return False


def get_all_users() -> list[tuple[int, str, str]]:
    """Yield (row_index_1_based, email, password_cell). Used by the migration script."""
    rows = _users_sheet().get_all_values()
    out: list[tuple[int, str, str]] = []
    for i, row in enumerate(rows, start=1):
        if len(row) < 2:
            continue
        out.append((i, row[0], row[1]))
    return out


def update_password_cell(row_index_1_based: int, new_value: str) -> None:
    """Overwrite column B of the given 1-based row with `new_value`."""
    _users_sheet().update_cell(row_index_1_based, 2, new_value)


def needs_hashing(stored: Optional[str]) -> bool:
    return bool(stored) and not _is_bcrypt(stored)
