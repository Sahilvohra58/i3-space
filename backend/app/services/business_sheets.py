from app.services.sheet_helpers import (
    get_or_create_sheet,
    get_all_snapshots as _get_all,
    append_snapshot as _append,
    delete_snapshot as _delete,
)

_HEADERS = [
    "date",
    "active_business_clients",
    "revenue_per_client",
    "time_to_close_days",
    "churn_rate",
]

_FIELDS = [
    ("active_business_clients", "int"),
    ("revenue_per_client", "float"),
    ("time_to_close_days", "int"),
    ("churn_rate", "float"),
]


def _sheet():
    return get_or_create_sheet("BUSINESS_SHEET_NAME", "business_tracker", _HEADERS)


def get_all_snapshots() -> list[dict]:
    return _get_all(_sheet(), _FIELDS)


def append_snapshot(
    date: str,
    active_business_clients: int,
    revenue_per_client: float,
    time_to_close_days: int,
    churn_rate: float,
) -> None:
    _append(_sheet(), [
        date,
        active_business_clients,
        revenue_per_client,
        time_to_close_days,
        churn_rate,
    ])


def delete_snapshot(row_index: int) -> None:
    _delete(_sheet(), row_index)
