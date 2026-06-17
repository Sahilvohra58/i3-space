from app.services.sheet_helpers import (
    get_or_create_sheet,
    get_all_snapshots as _get_all,
    append_snapshot as _append,
    delete_snapshot as _delete,
)

_HEADERS = [
    "date",
    "customer_retention_rate",
    "repeat_purchase_rate",
    "avg_clv",
    "partnership_renewal_rate",
    "referral_rate",
]

_FIELDS = [
    ("customer_retention_rate", "float"),
    ("repeat_purchase_rate", "float"),
    ("avg_clv", "float"),
    ("partnership_renewal_rate", "float"),
    ("referral_rate", "float"),
]


def _sheet():
    return get_or_create_sheet("LOYALTY_SHEET_NAME", "loyalty_tracker", _HEADERS)


def get_all_snapshots() -> list[dict]:
    return _get_all(_sheet(), _FIELDS)


def append_snapshot(
    date: str,
    customer_retention_rate: float,
    repeat_purchase_rate: float,
    avg_clv: float,
    partnership_renewal_rate: float,
    referral_rate: float,
) -> None:
    _append(_sheet(), [
        date,
        customer_retention_rate,
        repeat_purchase_rate,
        avg_clv,
        partnership_renewal_rate,
        referral_rate,
    ])


def delete_snapshot(row_index: int) -> None:
    _delete(_sheet(), row_index)
