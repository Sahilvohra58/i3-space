from fastapi import APIRouter, HTTPException
from app.models.media_sales import NewMediaSalesSnapshot, MediaSalesSnapshot
from app.services import media_sales_sheets

router = APIRouter(prefix="/media-sales", tags=["media-sales"])


@router.get("/snapshots", response_model=list[MediaSalesSnapshot])
def list_snapshots():
    try:
        return media_sales_sheets.get_all_snapshots()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch media-sales snapshots: {exc}")


@router.post("/snapshots", status_code=201)
def add_snapshot(payload: NewMediaSalesSnapshot):
    try:
        media_sales_sheets.append_snapshot(
            date=payload.date,
            channel_sponsors=payload.channel_sponsors,
            ad_revenue_per_sponsor=payload.ad_revenue_per_sponsor,
        )
        return {"message": "Snapshot added"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not add snapshot: {exc}")


@router.delete("/snapshots/{row_index}", status_code=204)
def remove_snapshot(row_index: int):
    try:
        media_sales_sheets.delete_snapshot(row_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete snapshot: {exc}")
