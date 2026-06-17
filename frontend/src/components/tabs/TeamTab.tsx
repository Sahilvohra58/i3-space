import SnapshotTab, { type SnapshotFieldSpec } from "./SnapshotTab";
import {
  getTeamSnapshots,
  addTeamSnapshot,
  deleteTeamSnapshot,
  type TeamSnapshot,
  type NewTeamSnapshot,
} from "../../api/team";

const FIELDS: SnapshotFieldSpec[] = [
  { key: "sales_recruited", label: "Sales Recruited", kind: "int" },
  { key: "training_hours_per_salesperson", label: "Training Hours / Salesperson", kind: "float", suffix: " h" },
  { key: "sales_cycle_length_days", label: "Sales Cycle Length (days)", kind: "int" },
];

const EMPTY: NewTeamSnapshot = {
  date: "",
  sales_recruited: 0,
  training_hours_per_salesperson: 0,
  sales_cycle_length_days: 0,
};

export default function TeamTab() {
  return (
    <SnapshotTab<TeamSnapshot, NewTeamSnapshot>
      title="Team Tracker"
      fields={FIELDS}
      emptyForm={EMPTY}
      fetchAll={getTeamSnapshots}
      add={addTeamSnapshot}
      remove={deleteTeamSnapshot}
    />
  );
}
