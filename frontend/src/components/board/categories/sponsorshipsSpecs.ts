import type { MetricKpiSpec } from "../MetricKpiGrid";
import type { MiniChartSpec } from "../MiniChartGrid";
import { SparklesIcon, ChartBarIcon, DollarIcon, MegaphoneIcon, HandshakeIcon } from "../MetricIcons";

export const SPONSORSHIPS_KPIS: MetricKpiSpec[] = [
  { key: "new_deals_closed", label: "New Deals Closed", type: "count", icon: SparklesIcon() },
  { key: "revenue_growth_rate", label: "Revenue Growth", type: "percent", icon: ChartBarIcon() },
  { key: "avg_deal_value", label: "Avg Deal Value", type: "currency", icon: DollarIcon() },
  { key: "engagement_rate", label: "Sponsor Engagement", type: "percent", icon: MegaphoneIcon() },
  { key: "retention_rate", label: "Sponsor Retention", type: "percent", icon: HandshakeIcon() },
];

export const SPONSORSHIPS_CHARTS: MiniChartSpec[] = [
  { title: "New Deals Closed", dataKey: "new_deals_closed", color: "#6366f1" },
  { title: "Revenue Growth", dataKey: "revenue_growth_rate", color: "#10b981", unitSuffix: "%" },
  { title: "Avg Deal Value", dataKey: "avg_deal_value", color: "#f59e0b", unitPrefix: "$" },
  { title: "Sponsor Engagement", dataKey: "engagement_rate", color: "#ec4899", unitSuffix: "%" },
  { title: "Sponsor Retention", dataKey: "retention_rate", color: "#8b5cf6", unitSuffix: "%" },
];
