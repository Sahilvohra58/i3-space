"""Shared helpers for category-snapshot Google Sheet adapters.

Each category tracker (volunteers, loyalty, outreach, business, sponsorships,
media_sales, team) follows the same shape: a single tab named `<category>_tracker`
with a header row and one row per snapshot. These helpers centralise the
repetitive get-or-create / safe-parse / append / delete logic so each
category service is just a thin spec (tab name + field list).
"""

from __future__ import annotations

import os
from functools import lru_cache
import gspread
from app.services.tracker_sheets import _get_client


@lru_cache(maxsize=32)
def _get_sheet_cached(
    spreadsheet_id: str,
    sheet_name: str,
    headers_tuple: tuple[str, ...],
) -> gspread.Worksheet:
    """Cached worksheet handle. Worksheet objects only store an ID — subsequent
    operations go directly to the cell-values API without re-fetching sheet
    metadata. This cuts ~1 Google Sheets read per request, which is critical
    because the API limits reads to 60/min/user on the free tier."""
    client = _get_client()
    spreadsheet = client.open_by_key(spreadsheet_id)
    try:
        return spreadsheet.worksheet(sheet_name)
    except gspread.WorksheetNotFound:
        headers = list(headers_tuple)
        sheet = spreadsheet.add_worksheet(
            title=sheet_name, rows=1000, cols=max(10, len(headers) + 2)
        )
        sheet.append_row(headers)
        return sheet


def get_or_create_sheet(env_var: str, default_name: str, headers: list[str]) -> gspread.Worksheet:
    return _get_sheet_cached(
        os.environ["SPREADSHEET_ID"],
        os.getenv(env_var, default_name),
        tuple(headers),
    )


def safe_float(value) -> float:
    """Parse a sheet cell to float; tolerates empty strings, whitespace, and non-numeric text."""
    if value is None:
        return 0.0
    s = str(value).strip()
    if not s:
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def safe_int(value) -> int:
    """Parse a sheet cell to int; tolerates empty strings, whitespace, and stray decimals."""
    if value is None:
        return 0
    s = str(value).strip()
    if not s:
        return 0
    try:
        return int(float(s))
    except ValueError:
        return 0


def get_all_snapshots(sheet: gspread.Worksheet, fields: list[tuple[str, str]]) -> list[dict]:
    """Read every snapshot row from the sheet.

    `fields` is a list of (field_name, kind) tuples describing how to parse
    each column AFTER the date column. `kind` is one of "int" or "float".
    """
    all_values = sheet.get_all_values()
    if len(all_values) <= 1:
        return []

    snapshots: list[dict] = []
    for i, row in enumerate(all_values[1:], start=1):
        if not row or not row[0].strip():
            continue
        snapshot: dict = {"row_index": i, "date": row[0]}
        for col_idx, (field_name, kind) in enumerate(fields, start=1):
            cell = row[col_idx] if col_idx < len(row) else ""
            snapshot[field_name] = safe_int(cell) if kind == "int" else safe_float(cell)
        snapshots.append(snapshot)
    return snapshots


def append_snapshot(sheet: gspread.Worksheet, row_values: list) -> None:
    sheet.append_row(row_values)


def delete_snapshot(sheet: gspread.Worksheet, row_index: int) -> None:
    """Delete a data row by its 1-based index (row 1 = first row after header)."""
    sheet.delete_rows(row_index + 1)
