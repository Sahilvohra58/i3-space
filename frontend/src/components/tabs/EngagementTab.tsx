import HrSnapshotTab from "./HrSnapshotTab";
import { ENGAGEMENT_FIELDS } from "../board/categories/volunteerSpecs";

const EMPTY = { date: "", nps_score: 0, training_participation_rate: 0 };

export default function EngagementTab() {
  return (
    <HrSnapshotTab
      title="Engagement Tracker"
      fields={ENGAGEMENT_FIELDS}
      emptyForm={EMPTY}
    />
  );
}
