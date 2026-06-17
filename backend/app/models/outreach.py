from pydantic import BaseModel


class NewOutreachSnapshot(BaseModel):
    date: str
    outreach_contacts_made: int          # count
    conversion_rate: float                # %
    response_rate: float                  # %
    meetings_scheduled: int              # count
    followup_rate: float                  # %


class OutreachSnapshot(NewOutreachSnapshot):
    row_index: int
