from fastapi import APIRouter, HTTPException
from app.models.sponsorships import NewSponsorshipSnapshot, SponsorshipSnapshot
from app.services import sponsorships_sheets

router = APIRouter(prefix="/sponsorships", tags=["sponsorships"])


@router.get("/snapshots", response_model=list[SponsorshipSnapshot])
def list_snapshots():
    try:
        return sponsorships_sheets.get_all_snapshots()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch sponsorship snapshots: {exc}")


@router.post("/snapshots", status_code=201)
def add_snapshot(payload: NewSponsorshipSnapshot):
    try:
        sponsorships_sheets.append_snapshot(
            date=payload.date,
            new_deals_closed=payload.new_deals_closed,
            revenue_growth_rate=payload.revenue_growth_rate,
            avg_deal_value=payload.avg_deal_value,
            engagement_rate=payload.engagement_rate,
            retention_rate=payload.retention_rate,
        )
        return {"message": "Snapshot added"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not add snapshot: {exc}")


@router.delete("/snapshots/{row_index}", status_code=204)
def remove_snapshot(row_index: int):
    try:
        sponsorships_sheets.delete_snapshot(row_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete snapshot: {exc}")
