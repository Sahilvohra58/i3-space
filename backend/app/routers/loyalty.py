from fastapi import APIRouter, HTTPException
from app.models.loyalty import NewLoyaltySnapshot, LoyaltySnapshot
from app.services import loyalty_db as loyalty_sheets

router = APIRouter(prefix="/loyalty", tags=["loyalty"])


@router.get("/snapshots", response_model=list[LoyaltySnapshot])
def list_snapshots():
    try:
        return loyalty_sheets.get_all_snapshots()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not fetch loyalty snapshots: {exc}")


@router.post("/snapshots", status_code=201)
def add_snapshot(payload: NewLoyaltySnapshot):
    try:
        loyalty_sheets.append_snapshot(
            date=payload.date,
            customer_retention_rate=payload.customer_retention_rate,
            repeat_purchase_rate=payload.repeat_purchase_rate,
            avg_clv=payload.avg_clv,
            partnership_renewal_rate=payload.partnership_renewal_rate,
            referral_rate=payload.referral_rate,
        )
        return {"message": "Snapshot added"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not add snapshot: {exc}")


@router.delete("/snapshots/{row_index}", status_code=204)
def remove_snapshot(row_index: int):
    try:
        loyalty_sheets.delete_snapshot(row_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete snapshot: {exc}")
