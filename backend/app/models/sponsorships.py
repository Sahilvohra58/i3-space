from pydantic import BaseModel


class NewSponsorshipSnapshot(BaseModel):
    date: str
    new_deals_closed: int                # count
    revenue_growth_rate: float            # %
    avg_deal_value: float                 # currency
    engagement_rate: float                # %
    retention_rate: float                 # %


class SponsorshipSnapshot(NewSponsorshipSnapshot):
    row_index: int
