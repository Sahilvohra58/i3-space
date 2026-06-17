from pydantic import BaseModel


class NewVolunteerSnapshot(BaseModel):
    date: str
    active_volunteers: int
    avg_time_to_fill_days: int
    churn_count: int
    nps_score: float
    training_participation_rate: float
    roles_with_kpis_rate: float
    performance_review_completion_rate: float
    mentorship_participation_rate: float


class VolunteerSnapshot(NewVolunteerSnapshot):
    row_index: int
