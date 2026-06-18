from fastapi import APIRouter, HTTPException
from app.models.volunteers import NewVolunteerSnapshot, VolunteerSnapshot
from app.services import volunteer_db as volunteer_sheets

router = APIRouter(prefix="/volunteers", tags=["volunteers"])


@router.get("/snapshots", response_model=list[VolunteerSnapshot])
def list_snapshots():
    try:
        return volunteer_sheets.get_all_snapshots()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch volunteer snapshots: {exc}")


@router.post("/snapshots", status_code=201)
def add_snapshot(payload: NewVolunteerSnapshot):
    try:
        volunteer_sheets.append_snapshot(
            date=payload.date,
            active_volunteers=payload.active_volunteers,
            avg_time_to_fill_days=payload.avg_time_to_fill_days,
            churn_count=payload.churn_count,
            nps_score=payload.nps_score,
            training_participation_rate=payload.training_participation_rate,
            roles_with_kpis_rate=payload.roles_with_kpis_rate,
            performance_review_completion_rate=payload.performance_review_completion_rate,
            mentorship_participation_rate=payload.mentorship_participation_rate,
        )
        return {"message": "Snapshot added"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not add snapshot: {exc}")


@router.delete("/snapshots/{row_index}", status_code=204)
def remove_snapshot(row_index: int):
    try:
        volunteer_sheets.delete_snapshot(row_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete snapshot: {exc}")
