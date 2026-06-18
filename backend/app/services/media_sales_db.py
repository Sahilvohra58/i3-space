from app.database import SessionLocal
from app.orm_models import MediaSalesSnapshot as ORM


def get_all_snapshots() -> list[dict]:
    with SessionLocal() as session:
        return [
            {
                "row_index": r.id, "date": r.date,
                "channel_sponsors": r.channel_sponsors,
                "ad_revenue_per_sponsor": r.ad_revenue_per_sponsor,
            }
            for r in session.query(ORM).order_by(ORM.id).all()
        ]


def append_snapshot(date, channel_sponsors, ad_revenue_per_sponsor):
    with SessionLocal() as session:
        session.add(ORM(date=date, channel_sponsors=channel_sponsors, ad_revenue_per_sponsor=ad_revenue_per_sponsor))
        session.commit()


def delete_snapshot(row_index: int) -> None:
    with SessionLocal() as session:
        row = session.get(ORM, row_index)
        if row:
            session.delete(row)
            session.commit()
