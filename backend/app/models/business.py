from pydantic import BaseModel


class NewBusinessSnapshot(BaseModel):
    date: str
    active_business_clients: int        # count
    revenue_per_client: float            # currency
    time_to_close_days: int             # duration (down-is-good)
    churn_rate: float                    # % (down-is-good)


class BusinessSnapshot(NewBusinessSnapshot):
    row_index: int
