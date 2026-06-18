from app.database import SessionLocal
from app.orm_models import VolunteerSnapshot as ORM


def get_all_snapshots() -> list[dict]:
    with SessionLocal() as session:
        return [
            {
                "row_index": r.id, "date": r.date,
                "active_volunteers": r.active_volunteers,
                "avg_time_to_fill_days": r.avg_time_to_fill_days,
                "churn_count": r.churn_count,
                "nps_score": r.nps_score,
                "training_participation_rate": r.training_participation_rate,
                "roles_with_kpis_rate": r.roles_with_kpis_rate,
                "performance_review_completion_rate": r.performance_review_completion_rate,
                "mentorship_participation_rate": r.mentorship_participation_rate,
            }
            for r in session.query(ORM).order_by(ORM.id).all()
        ]


def append_snapshot(date, active_volunteers, avg_time_to_fill_days, churn_count, nps_score,
                    training_participation_rate, roles_with_kpis_rate,
                    performance_review_completion_rate, mentorship_participation_rate):
    with SessionLocal() as session:
        session.add(ORM(
            date=date,
            active_volunteers=active_volunteers,
            avg_time_to_fill_days=avg_time_to_fill_days,
            churn_count=churn_count,
            nps_score=nps_score,
            training_participation_rate=training_participation_rate,
            roles_with_kpis_rate=roles_with_kpis_rate,
            performance_review_completion_rate=performance_review_completion_rate,
            mentorship_participation_rate=mentorship_participation_rate,
        ))
        session.commit()


def delete_snapshot(row_index: int) -> None:
    with SessionLocal() as session:
        row = session.get(ORM, row_index)
        if row:
            session.delete(row)
            session.commit()
