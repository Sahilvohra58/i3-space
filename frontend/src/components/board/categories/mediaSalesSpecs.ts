import type { MetricKpiSpec } from "../MetricKpiGrid";
import type { MiniChartSpec } from "../MiniChartGrid";
import { SpeakerIcon, DollarIcon } from "../MetricIcons";

export const MEDIA_SALES_KPIS: MetricKpiSpec[] = [
  { key: "channel_sponsors", label: "Channel Sponsors", type: "count", icon: SpeakerIcon() },
  { key: "ad_revenue_per_sponsor", label: "Ad Revenue / Sponsor", type: "currency", icon: DollarIcon() },
];

export const MEDIA_SALES_CHARTS: MiniChartSpec[] = [
  { title: "Channel Sponsors", dataKey: "channel_sponsors", color: "#6366f1" },
  { title: "Ad Revenue / Sponsor", dataKey: "ad_revenue_per_sponsor", color: "#10b981", unitPrefix: "$" },
];
