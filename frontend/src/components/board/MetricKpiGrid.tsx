import StatCard from "./StatCard";
import DeltaBadge from "./DeltaBadge";
import { formatMetric, type MetricType } from "../../utils/metricFormat";

export interface MetricKpi {
  value: number;
  delta: number | null;
}

export interface MetricKpiSpec {
  key: string;
  label: string;
  type: MetricType;
  goodWhenDown?: boolean;
  icon: React.ReactNode;
}

interface Props {
  specs: MetricKpiSpec[];
  values: Record<string, MetricKpi>;
  loading: boolean;
  /** Tailwind grid template at sm+; defaults to 3 */
  smColsClass?: string;
}

export default function MetricKpiGrid({ specs, values, loading, smColsClass = "sm:grid-cols-3" }: Props) {
  return (
    <div className={`grid grid-cols-1 ${smColsClass} gap-4`}>
      {specs.map((spec) => {
        const kpi = values[spec.key];
        if (loading || !kpi) {
          return <StatCard key={spec.key} label={spec.label} value="—" icon={spec.icon} />;
        }
        return (
          <StatCard
            key={spec.key}
            label={spec.label}
            value={formatMetric(kpi.value, spec.type)}
            icon={spec.icon}
            sub={<DeltaBadge delta={kpi.delta} goodWhenDown={spec.goodWhenDown} metricType={spec.type} />}
          />
        );
      })}
    </div>
  );
}
