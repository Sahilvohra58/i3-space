import SnapshotTab, { type SnapshotFieldSpec } from "./SnapshotTab";
import {
  getBusinessSnapshots,
  addBusinessSnapshot,
  deleteBusinessSnapshot,
  type BusinessSnapshot,
  type NewBusinessSnapshot,
} from "../../api/business";

const FIELDS: SnapshotFieldSpec[] = [
  { key: "active_business_clients", label: "Active Business Clients", kind: "int" },
  { key: "revenue_per_client", label: "Revenue per Client", kind: "float", prefix: "$" },
  { key: "time_to_close_days", label: "Time to Close (days)", kind: "int" },
  { key: "churn_rate", label: "Churn Rate", kind: "float", suffix: "%" },
];

const EMPTY: NewBusinessSnapshot = {
  date: "",
  active_business_clients: 0,
  revenue_per_client: 0,
  time_to_close_days: 0,
  churn_rate: 0,
};

export default function BusinessTab() {
  return (
    <SnapshotTab<BusinessSnapshot, NewBusinessSnapshot>
      title="Business Enrolled Tracker"
      fields={FIELDS}
      emptyForm={EMPTY}
      fetchAll={getBusinessSnapshots}
      add={addBusinessSnapshot}
      remove={deleteBusinessSnapshot}
    />
  );
}
