from app.database import SessionLocal
from app.orm_models import TeamSnapshot as ORM


def get_all_snapshots() -> list[dict]:
    with SessionLocal() as session:
        return [
            {
                "row_index": r.id, "date": r.date,
                "sales_recruited": r.sales_recruited,
                "training_hours_per_salesperson": r.training_hours_per_salesperson,
                "sales_cycle_length_days": r.sales_cycle_length_days,
            }
            for r in session.query(ORM).order_by(ORM.id).all()
        ]


def append_snapshot(date, sales_recruited, training_hours_per_salesperson, sales_cycle_length_days):
    with SessionLocal() as session:
        session.add(ORM(
            date=date,
            sales_recruited=sales_recruited,
            training_hours_per_salesperson=training_hours_per_salesperson,
            sales_cycle_length_days=sales_cycle_length_days,
        ))
        session.commit()


def delete_snapshot(row_index: int) -> None:
    with SessionLocal() as session:
        row = session.get(ORM, row_index)
        if row:
            session.delete(row)
            session.commit()
