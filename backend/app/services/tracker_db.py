"""YouTube tracker service backed by PostgreSQL."""
from app.database import SessionLocal
from app.orm_models import Channel, TrackerRow as TrackerRowORM


def get_all_rows() -> list[dict]:
    with SessionLocal() as session:
        rows = session.query(TrackerRowORM).order_by(TrackerRowORM.id).all()
        return [
            {
                "row_index": r.id,
                "date": r.date,
                "channel_name": r.channel_name,
                "views": r.views,
                "minutes_watched": r.minutes_watched,
            }
            for r in rows
        ]


def append_row(date: str, channel_name: str, views: int, minutes_watched: int) -> None:
    with SessionLocal() as session:
        session.add(TrackerRowORM(date=date, channel_name=channel_name, views=views, minutes_watched=minutes_watched))
        session.commit()


def delete_row(row_index: int) -> None:
    with SessionLocal() as session:
        row = session.get(TrackerRowORM, row_index)
        if row:
            session.delete(row)
            session.commit()


def get_channels() -> list[str]:
    with SessionLocal() as session:
        return [c.name for c in session.query(Channel).order_by(Channel.name).all()]


def add_channel(name: str) -> None:
    with SessionLocal() as session:
        if not session.query(Channel).filter(Channel.name == name).first():
            session.add(Channel(name=name))
            session.commit()
