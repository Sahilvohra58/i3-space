import type { MetricKpiSpec } from "../MetricKpiGrid";
import type { MiniChartSpec } from "../MiniChartGrid";
import { PhoneIcon, TargetIcon, InboxIcon, CalendarIcon, RepeatIcon } from "../MetricIcons";

export const OUTREACH_KPIS: MetricKpiSpec[] = [
  { key: "outreach_contacts_made", label: "Contacts Made", type: "count", icon: PhoneIcon() },
  { key: "conversion_rate", label: "Conversion Rate", type: "percent", icon: TargetIcon() },
  { key: "response_rate", label: "Response Rate", type: "percent", icon: InboxIcon() },
  { key: "meetings_scheduled", label: "Meetings Scheduled", type: "count", icon: CalendarIcon() },
  { key: "followup_rate", label: "Follow-up Rate", type: "percent", icon: RepeatIcon() },
];

export const OUTREACH_CHARTS: MiniChartSpec[] = [
  { title: "Contacts Made", dataKey: "outreach_contacts_made", color: "#6366f1" },
  { title: "Conversion Rate", dataKey: "conversion_rate", color: "#10b981", unitSuffix: "%" },
  { title: "Response Rate", dataKey: "response_rate", color: "#f59e0b", unitSuffix: "%" },
  { title: "Meetings Scheduled", dataKey: "meetings_scheduled", color: "#ec4899" },
  { title: "Follow-up Rate", dataKey: "followup_rate", color: "#8b5cf6", unitSuffix: "%" },
];
