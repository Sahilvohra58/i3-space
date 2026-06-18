from app.database import SessionLocal
from app.orm_models import LoyaltySnapshot as ORM


def get_all_snapshots() -> list[dict]:
    with SessionLocal() as session:
        return [
            {
                "row_index": r.id, "date": r.date,
                "customer_retention_rate": r.customer_retention_rate,
                "repeat_purchase_rate": r.repeat_purchase_rate,
                "avg_clv": r.avg_clv,
                "partnership_renewal_rate": r.partnership_renewal_rate,
                "referral_rate": r.referral_rate,
            }
            for r in session.query(ORM).order_by(ORM.id).all()
        ]


def append_snapshot(date, customer_retention_rate, repeat_purchase_rate, avg_clv, partnership_renewal_rate, referral_rate):
    with SessionLocal() as session:
        session.add(ORM(
            date=date,
            customer_retention_rate=customer_retention_rate,
            repeat_purchase_rate=repeat_purchase_rate,
            avg_clv=avg_clv,
            partnership_renewal_rate=partnership_renewal_rate,
            referral_rate=referral_rate,
        ))
        session.commit()


def delete_snapshot(row_index: int) -> None:
    with SessionLocal() as session:
        row = session.get(ORM, row_index)
        if row:
            session.delete(row)
            session.commit()
