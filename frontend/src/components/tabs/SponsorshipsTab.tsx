import SnapshotTab, { type SnapshotFieldSpec } from "./SnapshotTab";
import {
  getSponsorshipSnapshots,
  addSponsorshipSnapshot,
  deleteSponsorshipSnapshot,
  type SponsorshipSnapshot,
  type NewSponsorshipSnapshot,
} from "../../api/sponsorships";

const FIELDS: SnapshotFieldSpec[] = [
  { key: "new_deals_closed", label: "New Deals Closed", kind: "int" },
  { key: "revenue_growth_rate", label: "Revenue Growth Rate", kind: "float", suffix: "%" },
  { key: "avg_deal_value", label: "Avg Deal Value", kind: "float", prefix: "$" },
  { key: "engagement_rate", label: "Sponsor Engagement Rate", kind: "float", suffix: "%" },
  { key: "retention_rate", label: "Sponsor Retention Rate", kind: "float", suffix: "%" },
];

const EMPTY: NewSponsorshipSnapshot = {
  date: "",
  new_deals_closed: 0,
  revenue_growth_rate: 0,
  avg_deal_value: 0,
  engagement_rate: 0,
  retention_rate: 0,
};

export default function SponsorshipsTab() {
  return (
    <SnapshotTab<SponsorshipSnapshot, NewSponsorshipSnapshot>
      title="Sponsorships Tracker"
      fields={FIELDS}
      emptyForm={EMPTY}
      fetchAll={getSponsorshipSnapshots}
      add={addSponsorshipSnapshot}
      remove={deleteSponsorshipSnapshot}
    />
  );
}
