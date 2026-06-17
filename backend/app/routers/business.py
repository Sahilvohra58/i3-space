from fastapi import APIRouter, HTTPException
from app.models.business import NewBusinessSnapshot, BusinessSnapshot
from app.services import business_sheets

router = APIRouter(prefix="/business", tags=["business"])


@router.get("/snapshots", response_model=list[BusinessSnapshot])
def list_snapshots():
    try:
        return business_sheets.get_all_snapshots()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch business snapshots: {exc}")


@router.post("/snapshots", status_code=201)
def add_snapshot(payload: NewBusinessSnapshot):
    try:
        business_sheets.append_snapshot(
            date=payload.date,
            active_business_clients=payload.active_business_clients,
            revenue_per_client=payload.revenue_per_client,
            time_to_close_days=payload.time_to_close_days,
            churn_rate=payload.churn_rate,
        )
        return {"message": "Snapshot added"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not add snapshot: {exc}")


@router.delete("/snapshots/{row_index}", status_code=204)
def remove_snapshot(row_index: int):
    try:
        business_sheets.delete_snapshot(row_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete snapshot: {exc}")
