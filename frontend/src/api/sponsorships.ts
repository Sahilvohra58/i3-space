import { api } from "./client";

export interface SponsorshipSnapshot {
  row_index: number;
  date: string;
  new_deals_closed: number;
  revenue_growth_rate: number;
  avg_deal_value: number;
  engagement_rate: number;
  retention_rate: number;
}

export interface NewSponsorshipSnapshot {
  date: string;
  new_deals_closed: number;
  revenue_growth_rate: number;
  avg_deal_value: number;
  engagement_rate: number;
  retention_rate: number;
}

export async function getSponsorshipSnapshots(): Promise<SponsorshipSnapshot[]> {
  const { data } = await api.get<SponsorshipSnapshot[]>("/sponsorships/snapshots");
  return data;
}

export async function addSponsorshipSnapshot(snapshot: NewSponsorshipSnapshot): Promise<void> {
  await api.post("/sponsorships/snapshots", snapshot);
}

export async function deleteSponsorshipSnapshot(rowIndex: number): Promise<void> {
  await api.delete(`/sponsorships/snapshots/${rowIndex}`);
}
