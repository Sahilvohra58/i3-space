import { api } from "./client";

export interface VolunteerSnapshot {
  row_index: number;
  date: string;
  active_volunteers: number;
  avg_time_to_fill_days: number;
  churn_count: number;
  nps_score: number;
  training_participation_rate: number;
  roles_with_kpis_rate: number;
  performance_review_completion_rate: number;
  mentorship_participation_rate: number;
  [key: string]: number | string;
}

export interface NewVolunteerSnapshot {
  date: string;
  active_volunteers: number;
  avg_time_to_fill_days: number;
  churn_count: number;
  nps_score: number;
  training_participation_rate: number;
  roles_with_kpis_rate: number;
  performance_review_completion_rate: number;
  mentorship_participation_rate: number;
}

export async function getVolunteerSnapshots(): Promise<VolunteerSnapshot[]> {
  const { data } = await api.get<VolunteerSnapshot[]>("/volunteers/snapshots");
  return data;
}

export async function addVolunteerSnapshot(snapshot: NewVolunteerSnapshot): Promise<void> {
  await api.post("/volunteers/snapshots", snapshot);
}

/** Upserts by date — merges with an existing row when the date already exists. */
export async function upsertVolunteerSnapshot(snapshot: NewVolunteerSnapshot): Promise<void> {
  await api.post("/volunteers/snapshots", snapshot);
}

export async function deleteVolunteerSnapshot(rowIndex: number): Promise<void> {
  await api.delete(`/volunteers/snapshots/${rowIndex}`);
}
