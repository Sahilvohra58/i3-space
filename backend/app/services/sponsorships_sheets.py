from app.services.sheet_helpers import (
    get_or_create_sheet,
    get_all_snapshots as _get_all,
    append_snapshot as _append,
    delete_snapshot as _delete,
)

_HEADERS = [
    "date",
    "new_deals_closed",
    "revenue_growth_rate",
    "avg_deal_value",
    "engagement_rate",
    "retention_rate",
]

_FIELDS = [
    ("new_deals_closed", "int"),
    ("revenue_growth_rate", "float"),
    ("avg_deal_value", "float"),
    ("engagement_rate", "float"),
    ("retention_rate", "float"),
]


def _sheet():
    return get_or_create_sheet("SPONSORSHIPS_SHEET_NAME", "sponsorships_tracker", _HEADERS)


def get_all_snapshots() -> list[dict]:
    return _get_all(_sheet(), _FIELDS)


def append_snapshot(
    date: str,
    new_deals_closed: int,
    revenue_growth_rate: float,
    avg_deal_value: float,
    engagement_rate: float,
    retention_rate: float,
) -> None:
    _append(_sheet(), [
        date,
        new_deals_closed,
        revenue_growth_rate,
        avg_deal_value,
        engagement_rate,
        retention_rate,
    ])


def delete_snapshot(row_index: int) -> None:
    _delete(_sheet(), row_index)
