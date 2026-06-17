import type { MetricKpiSpec } from "../MetricKpiGrid";
import type { MiniChartSpec } from "../MiniChartGrid";
import type { SnapshotFieldSpec } from "../../tabs/SnapshotTab";
import {
  UsersIcon,
  ClockIcon,
  TrendingDownIcon,
  ChartBarIcon,
  AcademicCapIcon,
  TargetIcon,
  PresentationIcon,
  HandshakeIcon,
} from "../MetricIcons";

export const VOLUNTEER_METRIC_KEYS = [
  "active_volunteers",
  "avg_time_to_fill_days",
  "churn_count",
  "nps_score",
  "training_participation_rate",
  "roles_with_kpis_rate",
  "performance_review_completion_rate",
  "mentorship_participation_rate",
] as const;

export const VOLUNTEER_ONLY_FIELDS: SnapshotFieldSpec[] = [
  { key: "active_volunteers", label: "Active Volunteers", kind: "int" },
  { key: "avg_time_to_fill_days", label: "Avg Time to Fill (days)", kind: "int" },
  { key: "churn_count", label: "Churn Count", kind: "int" },
];

export const ENGAGEMENT_FIELDS: SnapshotFieldSpec[] = [
  { key: "nps_score", label: "NPS Score", kind: "float", min: -100 },
  { key: "training_participation_rate", label: "Training Participation", kind: "float", suffix: "%" },
];

export const PROCESS_FIELDS: SnapshotFieldSpec[] = [
  { key: "roles_with_kpis_rate", label: "Roles with Defined KPIs", kind: "float", suffix: "%" },
  {
    key: "performance_review_completion_rate",
    label: "Performance Review Completion",
    kind: "float",
    suffix: "%",
  },
  { key: "mentorship_participation_rate", label: "Mentorship Participation", kind: "float", suffix: "%" },
];

/** All HR fields — used when exporting the full tracker */
export const VOLUNTEER_FIELDS: SnapshotFieldSpec[] = [
  ...VOLUNTEER_ONLY_FIELDS,
  ...ENGAGEMENT_FIELDS,
  ...PROCESS_FIELDS,
];

export const VOLUNTEER_KPI_SPECS: MetricKpiSpec[] = [
  { key: "active_volunteers", label: "Active Volunteers", type: "count", icon: UsersIcon() },
  {
    key: "avg_time_to_fill_days",
    label: "Avg Time to Fill",
    type: "duration",
    icon: ClockIcon(),
    goodWhenDown: true,
  },
  { key: "churn_count", label: "Churn", type: "count", icon: TrendingDownIcon(), goodWhenDown: true },
];

export const ENGAGEMENT_KPI_SPECS: MetricKpiSpec[] = [
  { key: "nps_score", label: "NPS Score", type: "count", icon: ChartBarIcon() },
  {
    key: "training_participation_rate",
    label: "Training Participation",
    type: "percent",
    icon: AcademicCapIcon(),
  },
];

export const PROCESS_KPI_SPECS: MetricKpiSpec[] = [
  { key: "roles_with_kpis_rate", label: "Roles with KPIs", type: "percent", icon: TargetIcon() },
  {
    key: "performance_review_completion_rate",
    label: "Review Completion",
    type: "percent",
    icon: PresentationIcon(),
  },
  {
    key: "mentorship_participation_rate",
    label: "Mentorship Participation",
    type: "percent",
    icon: HandshakeIcon(),
  },
];

export const VOLUNTEER_CHARTS: MiniChartSpec[] = [
  { title: "Active Volunteers", dataKey: "active_volunteers", color: "#6366f1" },
  { title: "Avg Time to Fill", dataKey: "avg_time_to_fill_days", color: "#f59e0b", unitSuffix: " d" },
  { title: "Churn", dataKey: "churn_count", color: "#ef4444" },
  { title: "NPS Score", dataKey: "nps_score", color: "#8b5cf6" },
  { title: "Training Participation", dataKey: "training_participation_rate", color: "#10b981", unitSuffix: "%" },
  { title: "Roles with KPIs", dataKey: "roles_with_kpis_rate", color: "#ec4899", unitSuffix: "%" },
  {
    title: "Review Completion",
    dataKey: "performance_review_completion_rate",
    color: "#0ea5e9",
    unitSuffix: "%",
  },
  {
    title: "Mentorship Participation",
    dataKey: "mentorship_participation_rate",
    color: "#14b8a6",
    unitSuffix: "%",
  },
];

export const EMPTY_VOLUNTEER_FORM = {
  date: "",
  active_volunteers: 0,
  avg_time_to_fill_days: 0,
  churn_count: 0,
  nps_score: 0,
  training_participation_rate: 0,
  roles_with_kpis_rate: 0,
  performance_review_completion_rate: 0,
  mentorship_participation_rate: 0,
};
