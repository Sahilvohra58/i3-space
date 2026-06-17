import { api } from "./client";

export interface MediaSalesSnapshot {
  row_index: number;
  date: string;
  channel_sponsors: number;
  ad_revenue_per_sponsor: number;
}

export interface NewMediaSalesSnapshot {
  date: string;
  channel_sponsors: number;
  ad_revenue_per_sponsor: number;
}

export async function getMediaSalesSnapshots(): Promise<MediaSalesSnapshot[]> {
  const { data } = await api.get<MediaSalesSnapshot[]>("/media-sales/snapshots");
  return data;
}

export async function addMediaSalesSnapshot(snapshot: NewMediaSalesSnapshot): Promise<void> {
  await api.post("/media-sales/snapshots", snapshot);
}

export async function deleteMediaSalesSnapshot(rowIndex: number): Promise<void> {
  await api.delete(`/media-sales/snapshots/${rowIndex}`);
}
