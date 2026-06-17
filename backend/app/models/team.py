from pydantic import BaseModel


class NewTeamSnapshot(BaseModel):
    date: str
    sales_recruited: int                  # count
    training_hours_per_salesperson: float # count (allow decimals e.g. 7.5h)
    sales_cycle_length_days: int         # duration (down-is-good)


class TeamSnapshot(NewTeamSnapshot):
    row_index: int
