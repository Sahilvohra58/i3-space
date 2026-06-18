from app.database import SessionLocal
from app.orm_models import SponsorshipSnapshot as ORM


def get_all_snapshots() -> list[dict]:
    with SessionLocal() as session:
        return [
            {
                "row_index": r.id, "date": r.date,
                "new_deals_closed": r.new_deals_closed,
                "revenue_growth_rate": r.revenue_growth_rate,
                "avg_deal_value": r.avg_deal_value,
                "engagement_rate": r.engagement_rate,
                "retention_rate": r.retention_rate,
            }
            for r in session.query(ORM).order_by(ORM.id).all()
        ]


def append_snapshot(date, new_deals_closed, revenue_growth_rate, avg_deal_value, engagement_rate, retention_rate):
    with SessionLocal() as session:
        session.add(ORM(
            date=date,
            new_deals_closed=new_deals_closed,
            revenue_growth_rate=revenue_growth_rate,
            avg_deal_value=avg_deal_value,
            engagement_rate=engagement_rate,
            retention_rate=retention_rate,
        ))
        session.commit()


def delete_snapshot(row_index: int) -> None:
    with SessionLocal() as session:
        row = session.get(ORM, row_index)
        if row:
            session.delete(row)
            session.commit()
