from fastapi import APIRouter, HTTPException
from app.models.outreach import NewOutreachSnapshot, OutreachSnapshot
from app.services import outreach_sheets

router = APIRouter(prefix="/outreach", tags=["outreach"])


@router.get("/snapshots", response_model=list[OutreachSnapshot])
def list_snapshots():
    try:
        return outreach_sheets.get_all_snapshots()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch outreach snapshots: {exc}")


@router.post("/snapshots", status_code=201)
def add_snapshot(payload: NewOutreachSnapshot):
    try:
        outreach_sheets.append_snapshot(
            date=payload.date,
            outreach_contacts_made=payload.outreach_contacts_made,
            conversion_rate=payload.conversion_rate,
            response_rate=payload.response_rate,
            meetings_scheduled=payload.meetings_scheduled,
            followup_rate=payload.followup_rate,
        )
        return {"message": "Snapshot added"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not add snapshot: {exc}")


@router.delete("/snapshots/{row_index}", status_code=204)
def remove_snapshot(row_index: int):
    try:
        outreach_sheets.delete_snapshot(row_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete snapshot: {exc}")
