from app.database import SessionLocal
from app.orm_models import BusinessSnapshot as BusinessSnapshotORM


def get_all_snapshots() -> list[dict]:
    with SessionLocal() as session:
        rows = session.query(BusinessSnapshotORM).order_by(BusinessSnapshotORM.id).all()
        return [
            {
                "row_index": r.id,
                "date": r.date,
                "active_business_clients": r.active_business_clients,
                "revenue_per_client": r.revenue_per_client,
                "time_to_close_days": r.time_to_close_days,
                "churn_rate": r.churn_rate,
            }
            for r in rows
        ]


def append_snapshot(date, active_business_clients, revenue_per_client, time_to_close_days, churn_rate):
    with SessionLocal() as session:
        session.add(BusinessSnapshotORM(
            date=date,
            active_business_clients=active_business_clients,
            revenue_per_client=revenue_per_client,
            time_to_close_days=time_to_close_days,
            churn_rate=churn_rate,
        ))
        session.commit()


def delete_snapshot(row_index: int) -> None:
    with SessionLocal() as session:
        row = session.get(BusinessSnapshotORM, row_index)
        if row:
            session.delete(row)
            session.commit()
