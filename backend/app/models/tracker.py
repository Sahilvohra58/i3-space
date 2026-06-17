from pydantic import BaseModel


class NewTrackerRow(BaseModel):
    date: str
    channel_name: str
    views: int
    minutes_watched: int


class TrackerRow(NewTrackerRow):
    row_index: int
