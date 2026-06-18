from app.database import SessionLocal
from app.orm_models import OutreachSnapshot as ORM


def get_all_snapshots() -> list[dict]:
    with SessionLocal() as session:
        return [
            {
                "row_index": r.id, "date": r.date,
                "outreach_contacts_made": r.outreach_contacts_made,
                "conversion_rate": r.conversion_rate,
                "response_rate": r.response_rate,
                "meetings_scheduled": r.meetings_scheduled,
                "followup_rate": r.followup_rate,
            }
            for r in session.query(ORM).order_by(ORM.id).all()
        ]


def append_snapshot(date, outreach_contacts_made, conversion_rate, response_rate, meetings_scheduled, followup_rate):
    with SessionLocal() as session:
        session.add(ORM(
            date=date,
            outreach_contacts_made=outreach_contacts_made,
            conversion_rate=conversion_rate,
            response_rate=response_rate,
            meetings_scheduled=meetings_scheduled,
            followup_rate=followup_rate,
        ))
        session.commit()


def delete_snapshot(row_index: int) -> None:
    with SessionLocal() as session:
        row = session.get(ORM, row_index)
        if row:
            session.delete(row)
            session.commit()
