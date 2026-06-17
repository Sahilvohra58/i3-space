import HrSnapshotTab from "./HrSnapshotTab";
import { VOLUNTEER_ONLY_FIELDS } from "../board/categories/volunteerSpecs";

const EMPTY = { date: "", active_volunteers: 0, avg_time_to_fill_days: 0, churn_count: 0 };

export default function VolunteersTab() {
  return (
    <HrSnapshotTab
      title="Volunteers Tracker"
      fields={VOLUNTEER_ONLY_FIELDS}
      emptyForm={EMPTY}
    />
  );
}
