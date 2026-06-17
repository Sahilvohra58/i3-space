from app.services.sheet_helpers import (
    get_or_create_sheet,
    get_all_snapshots as _get_all,
    append_snapshot as _append,
    delete_snapshot as _delete,
)

_HEADERS = [
    "date",
    "sales_recruited",
    "training_hours_per_salesperson",
    "sales_cycle_length_days",
]

_FIELDS = [
    ("sales_recruited", "int"),
    ("training_hours_per_salesperson", "float"),
    ("sales_cycle_length_days", "int"),
]


def _sheet():
    return get_or_create_sheet("TEAM_SHEET_NAME", "team_tracker", _HEADERS)


def get_all_snapshots() -> list[dict]:
    return _get_all(_sheet(), _FIELDS)


def append_snapshot(
    date: str,
    sales_recruited: int,
    training_hours_per_salesperson: float,
    sales_cycle_length_days: int,
) -> None:
    _append(_sheet(), [
        date,
        sales_recruited,
        training_hours_per_salesperson,
        sales_cycle_length_days,
    ])


def delete_snapshot(row_index: int) -> None:
    _delete(_sheet(), row_index)
