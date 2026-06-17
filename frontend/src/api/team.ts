import { api } from "./client";

export interface TeamSnapshot {
  row_index: number;
  date: string;
  sales_recruited: number;
  training_hours_per_salesperson: number;
  sales_cycle_length_days: number;
}

export interface NewTeamSnapshot {
  date: string;
  sales_recruited: number;
  training_hours_per_salesperson: number;
  sales_cycle_length_days: number;
}

export async function getTeamSnapshots(): Promise<TeamSnapshot[]> {
  const { data } = await api.get<TeamSnapshot[]>("/team/snapshots");
  return data;
}

export async function addTeamSnapshot(snapshot: NewTeamSnapshot): Promise<void> {
  await api.post("/team/snapshots", snapshot);
}

export async function deleteTeamSnapshot(rowIndex: number): Promise<void> {
  await api.delete(`/team/snapshots/${rowIndex}`);
}
