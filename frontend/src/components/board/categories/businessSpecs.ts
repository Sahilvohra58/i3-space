import type { MetricKpiSpec } from "../MetricKpiGrid";
import type { MiniChartSpec } from "../MiniChartGrid";
import { BriefcaseIcon, DollarIcon, ClockIcon, TrendingDownIcon } from "../MetricIcons";

export const BUSINESS_KPIS: MetricKpiSpec[] = [
  { key: "active_business_clients", label: "Active Clients", type: "count", icon: BriefcaseIcon() },
  { key: "revenue_per_client", label: "Revenue / Client", type: "currency", icon: DollarIcon() },
  { key: "time_to_close_days", label: "Time to Close", type: "duration", icon: ClockIcon(), goodWhenDown: true },
  { key: "churn_rate", label: "Churn Rate", type: "percent", icon: TrendingDownIcon(), goodWhenDown: true },
];

export const BUSINESS_CHARTS: MiniChartSpec[] = [
  { title: "Active Clients", dataKey: "active_business_clients", color: "#6366f1" },
  { title: "Revenue / Client", dataKey: "revenue_per_client", color: "#10b981", unitPrefix: "$" },
  { title: "Time to Close", dataKey: "time_to_close_days", color: "#f59e0b", unitSuffix: " d" },
  { title: "Churn Rate", dataKey: "churn_rate", color: "#ef4444", unitSuffix: "%" },
];
