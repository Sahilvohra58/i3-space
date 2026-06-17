import os
import json
import gspread
from google.oauth2.service_account import Credentials
from functools import lru_cache

_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

_HEADERS = ["date", "channel_name", "views", "minutes_watched"]


@lru_cache(maxsize=1)
def _get_client() -> gspread.Client:
    # Prefer inline JSON (production env var) over a file path (local dev)
    json_str = os.getenv("GOOGLE_CREDENTIALS_JSON")
    if json_str:
        info = json.loads(json_str)
        creds = Credentials.from_service_account_info(info, scopes=_SCOPES)
    else:
        key_path = os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
        creds = Credentials.from_service_account_file(key_path, scopes=_SCOPES)
    return gspread.authorize(creds)


@lru_cache(maxsize=8)
def _get_sheet_cached(spreadsheet_id: str, sheet_name: str) -> gspread.Worksheet:
    """Cached worksheet handle. Worksheet objects only store an ID — subsequent
    operations on them go directly to the cell-values API without re-fetching
    sheet metadata. This cuts ~1 read per request."""
    client = _get_client()
    spreadsheet = client.open_by_key(spreadsheet_id)
    try:
        return spreadsheet.worksheet(sheet_name)
    except gspread.WorksheetNotFound:
        sheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=10)
        sheet.append_row(_HEADERS)
        return sheet


def _get_sheet() -> gspread.Worksheet:
    return _get_sheet_cached(
        os.environ["SPREADSHEET_ID"],
        os.getenv("TRACKER_SHEET_NAME", "youtube_tracker"),
    )


def get_all_rows() -> list[dict]:
    sheet = _get_sheet()
    all_values = sheet.get_all_values()

    if len(all_values) <= 1:
        return []

    rows = []
    for i, row in enumerate(all_values[1:], start=1):
        if len(row) >= 4:
            rows.append({
                "row_index": i,
                "date": row[0],
                "channel_name": row[1],
                "views": int(row[2]) if row[2].isdigit() else 0,
                "minutes_watched": int(row[3]) if row[3].isdigit() else 0,
            })
    return rows


def append_row(date: str, channel_name: str, views: int, minutes_watched: int) -> None:
    sheet = _get_sheet()
    sheet.append_row([date, channel_name, views, minutes_watched])


def delete_row(row_index: int) -> None:
    """Delete a data row by its 1-based index (row 1 = first row after header)."""
    sheet = _get_sheet()
    # Sheet row = row_index + 1 (offset by the header row)
    sheet.delete_rows(row_index + 1)


def get_channels() -> list[str]:
    """Return channel names from the 'channels' sheet (skips the header row)."""
    spreadsheet_id = os.environ["SPREADSHEET_ID"]
    channels_sheet_name = os.getenv("CHANNELS_SHEET_NAME", "channels")
    client = _get_client()
    spreadsheet = client.open_by_key(spreadsheet_id)
    try:
        sheet = spreadsheet.worksheet(channels_sheet_name)
    except gspread.WorksheetNotFound:
        return []
    values = sheet.col_values(1)
    # Skip the header row
    return [v.strip() for v in values[1:] if v.strip()]
