import SnapshotTab, { type SnapshotFieldSpec } from "./SnapshotTab";
import {
  getOutreachSnapshots,
  addOutreachSnapshot,
  deleteOutreachSnapshot,
  type OutreachSnapshot,
  type NewOutreachSnapshot,
} from "../../api/outreach";

const FIELDS: SnapshotFieldSpec[] = [
  { key: "outreach_contacts_made", label: "Outreach Contacts Made", kind: "int" },
  { key: "conversion_rate", label: "Conversion Rate", kind: "float", suffix: "%" },
  { key: "response_rate", label: "Response Rate", kind: "float", suffix: "%" },
  { key: "meetings_scheduled", label: "Meetings Scheduled", kind: "int" },
  { key: "followup_rate", label: "Follow-up Rate", kind: "float", suffix: "%" },
];

const EMPTY: NewOutreachSnapshot = {
  date: "",
  outreach_contacts_made: 0,
  conversion_rate: 0,
  response_rate: 0,
  meetings_scheduled: 0,
  followup_rate: 0,
};

export default function OutreachTab() {
  return (
    <SnapshotTab<OutreachSnapshot, NewOutreachSnapshot>
      title="Business Outreach Tracker"
      fields={FIELDS}
      emptyForm={EMPTY}
      fetchAll={getOutreachSnapshots}
      add={addOutreachSnapshot}
      remove={deleteOutreachSnapshot}
    />
  );
}
