from fastapi import APIRouter, HTTPException
from app.models.team import NewTeamSnapshot, TeamSnapshot
from app.services import team_sheets

router = APIRouter(prefix="/team", tags=["team"])


@router.get("/snapshots", response_model=list[TeamSnapshot])
def list_snapshots():
    try:
        return team_sheets.get_all_snapshots()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch team snapshots: {exc}")


@router.post("/snapshots", status_code=201)
def add_snapshot(payload: NewTeamSnapshot):
    try:
        team_sheets.append_snapshot(
            date=payload.date,
            sales_recruited=payload.sales_recruited,
            training_hours_per_salesperson=payload.training_hours_per_salesperson,
            sales_cycle_length_days=payload.sales_cycle_length_days,
        )
        return {"message": "Snapshot added"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not add snapshot: {exc}")


@router.delete("/snapshots/{row_index}", status_code=204)
def remove_snapshot(row_index: int):
    try:
        team_sheets.delete_snapshot(row_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete snapshot: {exc}")
