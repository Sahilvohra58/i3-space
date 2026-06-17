from pydantic import BaseModel


class NewMediaSalesSnapshot(BaseModel):
    date: str
    channel_sponsors: int                 # count
    ad_revenue_per_sponsor: float        # currency


class MediaSalesSnapshot(NewMediaSalesSnapshot):
    row_index: int
