from app.services.sheet_helpers import (
    get_or_create_sheet,
    get_all_snapshots as _get_all,
    append_snapshot as _append,
    delete_snapshot as _delete,
)

_HEADERS = [
    "date",
    "outreach_contacts_made",
    "conversion_rate",
    "response_rate",
    "meetings_scheduled",
    "followup_rate",
]

_FIELDS = [
    ("outreach_contacts_made", "int"),
    ("conversion_rate", "float"),
    ("response_rate", "float"),
    ("meetings_scheduled", "int"),
    ("followup_rate", "float"),
]


def _sheet():
    return get_or_create_sheet("OUTREACH_SHEET_NAME", "outreach_tracker", _HEADERS)


def get_all_snapshots() -> list[dict]:
    return _get_all(_sheet(), _FIELDS)


def append_snapshot(
    date: str,
    outreach_contacts_made: int,
    conversion_rate: float,
    response_rate: float,
    meetings_scheduled: int,
    followup_rate: float,
) -> None:
    _append(_sheet(), [
        date,
        outreach_contacts_made,
        conversion_rate,
        response_rate,
        meetings_scheduled,
        followup_rate,
    ])


def delete_snapshot(row_index: int) -> None:
    _delete(_sheet(), row_index)
