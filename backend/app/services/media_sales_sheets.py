from app.services.sheet_helpers import (
    get_or_create_sheet,
    get_all_snapshots as _get_all,
    append_snapshot as _append,
    delete_snapshot as _delete,
)

_HEADERS = [
    "date",
    "channel_sponsors",
    "ad_revenue_per_sponsor",
]

_FIELDS = [
    ("channel_sponsors", "int"),
    ("ad_revenue_per_sponsor", "float"),
]


def _sheet():
    return get_or_create_sheet("MEDIA_SALES_SHEET_NAME", "media_sales_tracker", _HEADERS)


def get_all_snapshots() -> list[dict]:
    return _get_all(_sheet(), _FIELDS)


def append_snapshot(
    date: str,
    channel_sponsors: int,
    ad_revenue_per_sponsor: float,
) -> None:
    _append(_sheet(), [
        date,
        channel_sponsors,
        ad_revenue_per_sponsor,
    ])


def delete_snapshot(row_index: int) -> None:
    _delete(_sheet(), row_index)
