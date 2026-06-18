from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app.models.tracker import NewTrackerRow, TrackerRow
from app.services import tracker_db as tracker_sheets

router = APIRouter(prefix="/tracker", tags=["tracker"])


@router.get("/rows", response_model=list[TrackerRow])
def list_rows():
    try:
        return tracker_sheets.get_all_rows()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch tracker rows: {exc}")


@router.post("/rows", status_code=201)
def add_row(payload: NewTrackerRow):
    try:
        tracker_sheets.append_row(
            date=payload.date,
            channel_name=payload.channel_name,
            views=payload.views,
            minutes_watched=payload.minutes_watched,
        )
        return {"message": "Row added"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not add row: {exc}")


@router.delete("/rows/{row_index}", status_code=204)
def remove_row(row_index: int):
    try:
        tracker_sheets.delete_row(row_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete row: {exc}")


class NewChannel(BaseModel):
    name: str


@router.get("/channels", response_model=list[str])
def list_channels():
    try:
        return tracker_sheets.get_channels()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch channels: {exc}")


@router.post("/channels", status_code=201)
def create_channel(payload: NewChannel):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Channel name cannot be empty")
    try:
        tracker_sheets.add_channel(name)
        return {"name": name}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not create channel: {exc}")
