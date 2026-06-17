import SnapshotTab, { type SnapshotFieldSpec } from "./SnapshotTab";
import {
  getMediaSalesSnapshots,
  addMediaSalesSnapshot,
  deleteMediaSalesSnapshot,
  type MediaSalesSnapshot,
  type NewMediaSalesSnapshot,
} from "../../api/mediaSales";

const FIELDS: SnapshotFieldSpec[] = [
  { key: "channel_sponsors", label: "Channel Sponsors", kind: "int" },
  { key: "ad_revenue_per_sponsor", label: "Ad Revenue per Sponsor", kind: "float", prefix: "$" },
];

const EMPTY: NewMediaSalesSnapshot = {
  date: "",
  channel_sponsors: 0,
  ad_revenue_per_sponsor: 0,
};

export default function MediaSalesTab() {
  return (
    <SnapshotTab<MediaSalesSnapshot, NewMediaSalesSnapshot>
      title="Media Sales Tracker"
      fields={FIELDS}
      emptyForm={EMPTY}
      fetchAll={getMediaSalesSnapshots}
      add={addMediaSalesSnapshot}
      remove={deleteMediaSalesSnapshot}
    />
  );
}
