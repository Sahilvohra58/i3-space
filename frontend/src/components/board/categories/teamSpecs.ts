import type { MetricKpiSpec } from "../MetricKpiGrid";
import type { MiniChartSpec } from "../MiniChartGrid";
import { UsersIcon, AcademicCapIcon, ClockIcon } from "../MetricIcons";

export const TEAM_KPIS: MetricKpiSpec[] = [
  { key: "sales_recruited", label: "Sales Recruited", type: "count", icon: UsersIcon() },
  { key: "training_hours_per_salesperson", label: "Training Hours / Person", type: "count", icon: AcademicCapIcon() },
  { key: "sales_cycle_length_days", label: "Sales Cycle Length", type: "duration", icon: ClockIcon(), goodWhenDown: true },
];

export const TEAM_CHARTS: MiniChartSpec[] = [
  { title: "Sales Recruited", dataKey: "sales_recruited", color: "#6366f1" },
  { title: "Training Hours / Person", dataKey: "training_hours_per_salesperson", color: "#10b981", unitSuffix: " h" },
  { title: "Sales Cycle Length", dataKey: "sales_cycle_length_days", color: "#f59e0b", unitSuffix: " d" },
];
