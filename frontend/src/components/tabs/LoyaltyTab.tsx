import SnapshotTab, { type SnapshotFieldSpec } from "./SnapshotTab";
import {
  getLoyaltySnapshots,
  addLoyaltySnapshot,
  deleteLoyaltySnapshot,
  type LoyaltySnapshot,
  type NewLoyaltySnapshot,
} from "../../api/loyalty";

const FIELDS: SnapshotFieldSpec[] = [
  { key: "customer_retention_rate", label: "Customer Retention Rate", kind: "float", suffix: "%" },
  { key: "repeat_purchase_rate", label: "Repeat Purchase Rate", kind: "float", suffix: "%" },
  { key: "avg_clv", label: "Avg Customer Lifetime Value", kind: "float", prefix: "$" },
  { key: "partnership_renewal_rate", label: "Partnership Renewal Rate", kind: "float", suffix: "%" },
  { key: "referral_rate", label: "Referral Rate", kind: "float", suffix: "%" },
];

const EMPTY: NewLoyaltySnapshot = {
  date: "",
  customer_retention_rate: 0,
  repeat_purchase_rate: 0,
  avg_clv: 0,
  partnership_renewal_rate: 0,
  referral_rate: 0,
};

export default function LoyaltyTab() {
  return (
    <SnapshotTab<LoyaltySnapshot, NewLoyaltySnapshot>
      title="Loyalty & Partnership Tracker"
      fields={FIELDS}
      emptyForm={EMPTY}
      fetchAll={getLoyaltySnapshots}
      add={addLoyaltySnapshot}
      remove={deleteLoyaltySnapshot}
    />
  );
}
