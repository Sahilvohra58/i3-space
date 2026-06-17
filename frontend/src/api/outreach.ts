import { api } from "./client";

export interface OutreachSnapshot {
  row_index: number;
  date: string;
  outreach_contacts_made: number;
  conversion_rate: number;
  response_rate: number;
  meetings_scheduled: number;
  followup_rate: number;
}

export interface NewOutreachSnapshot {
  date: string;
  outreach_contacts_made: number;
  conversion_rate: number;
  response_rate: number;
  meetings_scheduled: number;
  followup_rate: number;
}

export async function getOutreachSnapshots(): Promise<OutreachSnapshot[]> {
  const { data } = await api.get<OutreachSnapshot[]>("/outreach/snapshots");
  return data;
}

export async function addOutreachSnapshot(snapshot: NewOutreachSnapshot): Promise<void> {
  await api.post("/outreach/snapshots", snapshot);
}

export async function deleteOutreachSnapshot(rowIndex: number): Promise<void> {
  await api.delete(`/outreach/snapshots/${rowIndex}`);
}
