from app.services.sheet_helpers import (
    get_or_create_sheet,
    get_all_snapshots as _get_all,
    append_snapshot as _append,
    delete_snapshot as _delete,
)

_HEADERS = [
    "date",
    "active_volunteers",
    "avg_time_to_fill_days",
    "churn_count",
    "nps_score",
    "training_participation_rate",
    "roles_with_kpis_rate",
    "performance_review_completion_rate",
    "mentorship_participation_rate",
]

_FIELDS = [
    ("active_volunteers", "int"),
    ("avg_time_to_fill_days", "int"),
    ("churn_count", "int"),
    ("nps_score", "float"),
    ("training_participation_rate", "float"),
    ("roles_with_kpis_rate", "float"),
    ("performance_review_completion_rate", "float"),
    ("mentorship_participation_rate", "float"),
]


def _sheet():
    return get_or_create_sheet("VOLUNTEERS_SHEET_NAME", "volunteers_tracker", _HEADERS)


def get_all_snapshots() -> list[dict]:
    return _get_all(_sheet(), _FIELDS)


def upsert_snapshot(
    date: str,
    active_volunteers: int,
    avg_time_to_fill_days: int,
    churn_count: int,
    nps_score: float,
    training_participation_rate: float,
    roles_with_kpis_rate: float,
    performance_review_completion_rate: float,
    mentorship_participation_rate: float,
) -> None:
    sheet = _sheet()
    row_values = [
        date,
        active_volunteers,
        avg_time_to_fill_days,
        churn_count,
        nps_score,
        training_participation_rate,
        roles_with_kpis_rate,
        performance_review_completion_rate,
        mentorship_participation_rate,
    ]
    for snapshot in get_all_snapshots():
        if snapshot["date"] == date:
            sheet.update(f"A{snapshot['row_index'] + 1}:I{snapshot['row_index'] + 1}", [row_values])
            return
    _append(sheet, row_values)


def append_snapshot(
    date: str,
    active_volunteers: int,
    avg_time_to_fill_days: int,
    churn_count: int,
    nps_score: float,
    training_participation_rate: float,
    roles_with_kpis_rate: float,
    performance_review_completion_rate: float,
    mentorship_participation_rate: float,
) -> None:
    upsert_snapshot(
        date,
        active_volunteers,
        avg_time_to_fill_days,
        churn_count,
        nps_score,
        training_participation_rate,
        roles_with_kpis_rate,
        performance_review_completion_rate,
        mentorship_participation_rate,
    )


def delete_snapshot(row_index: int) -> None:
    _delete(_sheet(), row_index)
