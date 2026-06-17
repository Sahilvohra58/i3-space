import type { MetricKpiSpec } from "../MetricKpiGrid";
import type { MiniChartSpec } from "../MiniChartGrid";
import { HeartIcon, RepeatIcon, DollarIcon, HandshakeIcon, ShareIcon } from "../MetricIcons";

export const LOYALTY_KPIS: MetricKpiSpec[] = [
  { key: "customer_retention_rate", label: "Customer Retention", type: "percent", icon: HeartIcon() },
  { key: "repeat_purchase_rate", label: "Repeat Purchase", type: "percent", icon: RepeatIcon() },
  { key: "avg_clv", label: "Avg Customer LTV", type: "currency", icon: DollarIcon() },
  { key: "partnership_renewal_rate", label: "Partnership Renewal", type: "percent", icon: HandshakeIcon() },
  { key: "referral_rate", label: "Referral Rate", type: "percent", icon: ShareIcon() },
];

export const LOYALTY_CHARTS: MiniChartSpec[] = [
  { title: "Customer Retention", dataKey: "customer_retention_rate", color: "#6366f1", unitSuffix: "%" },
  { title: "Repeat Purchase", dataKey: "repeat_purchase_rate", color: "#10b981", unitSuffix: "%" },
  { title: "Avg Customer LTV", dataKey: "avg_clv", color: "#f59e0b", unitPrefix: "$" },
  { title: "Partnership Renewal", dataKey: "partnership_renewal_rate", color: "#ec4899", unitSuffix: "%" },
  { title: "Referral Rate", dataKey: "referral_rate", color: "#8b5cf6", unitSuffix: "%" },
];
