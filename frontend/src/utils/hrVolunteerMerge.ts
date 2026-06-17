import type { NewVolunteerSnapshot, VolunteerSnapshot } from "../api/volunteers";

export const EMPTY_VOLUNTEER_SNAPSHOT: NewVolunteerSnapshot = {
  date: "",
  active_volunteers: 0,
  avg_time_to_fill_days: 0,
  churn_count: 0,
  nps_score: 0,
  training_participation_rate: 0,
  roles_with_kpis_rate: 0,
  performance_review_completion_rate: 0,
  mentorship_participation_rate: 0,
};

export function mergeVolunteerSnapshot(
  existing: VolunteerSnapshot | undefined,
  partial: Partial<NewVolunteerSnapshot> & { date: string },
): NewVolunteerSnapshot {
  const base = existing ?? { ...EMPTY_VOLUNTEER_SNAPSHOT, date: partial.date };
  return {
    date: partial.date,
    active_volunteers: partial.active_volunteers ?? base.active_volunteers,
    avg_time_to_fill_days: partial.avg_time_to_fill_days ?? base.avg_time_to_fill_days,
    churn_count: partial.churn_count ?? base.churn_count,
    nps_score: partial.nps_score ?? base.nps_score,
    training_participation_rate: partial.training_participation_rate ?? base.training_participation_rate,
    roles_with_kpis_rate: partial.roles_with_kpis_rate ?? base.roles_with_kpis_rate,
    performance_review_completion_rate:
      partial.performance_review_completion_rate ?? base.performance_review_completion_rate,
    mentorship_participation_rate:
      partial.mentorship_participation_rate ?? base.mentorship_participation_rate,
  };
}
