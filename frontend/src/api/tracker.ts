import { api } from "./client";

export interface TrackerRow {
  row_index: number;
  date: string;
  channel_name: string;
  views: number;
  minutes_watched: number;
}

export interface NewTrackerRow {
  date: string;
  channel_name: string;
  views: number;
  minutes_watched: number;
}

export async function getTrackerRows(): Promise<TrackerRow[]> {
  const { data } = await api.get<TrackerRow[]>("/tracker/rows");
  return data;
}

export async function addTrackerRow(row: NewTrackerRow): Promise<void> {
  await api.post("/tracker/rows", row);
}

export async function deleteTrackerRow(rowIndex: number): Promise<void> {
  await api.delete(`/tracker/rows/${rowIndex}`);
}

export async function getChannels(): Promise<string[]> {
  const { data } = await api.get<string[]>("/tracker/channels");
  return data;
}

export async function addChannel(name: string): Promise<void> {
  await api.post("/tracker/channels", { name });
}
