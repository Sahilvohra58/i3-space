import HrSnapshotTab from "./HrSnapshotTab";
import { PROCESS_FIELDS } from "../board/categories/volunteerSpecs";

const EMPTY = {
  date: "",
  roles_with_kpis_rate: 0,
  performance_review_completion_rate: 0,
  mentorship_participation_rate: 0,
};

export default function ProcessTab() {
  return (
    <HrSnapshotTab
      title="Process Tracker"
      fields={PROCESS_FIELDS}
      emptyForm={EMPTY}
    />
  );
}
