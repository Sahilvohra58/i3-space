import { api } from "./client";

export interface BusinessSnapshot {
  row_index: number;
  date: string;
  active_business_clients: number;
  revenue_per_client: number;
  time_to_close_days: number;
  churn_rate: number;
}

export interface NewBusinessSnapshot {
  date: string;
  active_business_clients: number;
  revenue_per_client: number;
  time_to_close_days: number;
  churn_rate: number;
}

export async function getBusinessSnapshots(): Promise<BusinessSnapshot[]> {
  const { data } = await api.get<BusinessSnapshot[]>("/business/snapshots");
  return data;
}

export async function addBusinessSnapshot(snapshot: NewBusinessSnapshot): Promise<void> {
  await api.post("/business/snapshots", snapshot);
}

export async function deleteBusinessSnapshot(rowIndex: number): Promise<void> {
  await api.delete(`/business/snapshots/${rowIndex}`);
}
