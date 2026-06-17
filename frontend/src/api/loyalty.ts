import { api } from "./client";

export interface LoyaltySnapshot {
  row_index: number;
  date: string;
  customer_retention_rate: number;
  repeat_purchase_rate: number;
  avg_clv: number;
  partnership_renewal_rate: number;
  referral_rate: number;
}

export interface NewLoyaltySnapshot {
  date: string;
  customer_retention_rate: number;
  repeat_purchase_rate: number;
  avg_clv: number;
  partnership_renewal_rate: number;
  referral_rate: number;
}

export async function getLoyaltySnapshots(): Promise<LoyaltySnapshot[]> {
  const { data } = await api.get<LoyaltySnapshot[]>("/loyalty/snapshots");
  return data;
}

export async function addLoyaltySnapshot(snapshot: NewLoyaltySnapshot): Promise<void> {
  await api.post("/loyalty/snapshots", snapshot);
}

export async function deleteLoyaltySnapshot(rowIndex: number): Promise<void> {
  await api.delete(`/loyalty/snapshots/${rowIndex}`);
}
