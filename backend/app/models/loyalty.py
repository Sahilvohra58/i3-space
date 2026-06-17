from pydantic import BaseModel


class NewLoyaltySnapshot(BaseModel):
    date: str
    customer_retention_rate: float       # %
    repeat_purchase_rate: float          # %
    avg_clv: float                        # currency
    partnership_renewal_rate: float      # %
    referral_rate: float                  # %


class LoyaltySnapshot(NewLoyaltySnapshot):
    row_index: int
