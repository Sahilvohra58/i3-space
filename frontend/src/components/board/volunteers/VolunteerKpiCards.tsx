import MetricKpiGrid from "../MetricKpiGrid";
import type { MetricKpi } from "../MetricKpiGrid";
import {
  VOLUNTEER_KPI_SPECS,
  ENGAGEMENT_KPI_SPECS,
  PROCESS_KPI_SPECS,
} from "../categories/volunteerSpecs";

interface Props {
  kpis: Record<string, MetricKpi>;
  loading: boolean;
}

function MetricGroup({
  title,
  specs,
  kpis,
  loading,
  smColsClass,
}: {
  title: string;
  specs: typeof VOLUNTEER_KPI_SPECS;
  kpis: Record<string, MetricKpi>;
  loading: boolean;
  smColsClass: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
      <MetricKpiGrid specs={specs} values={kpis} loading={loading} smColsClass={smColsClass} />
    </div>
  );
}

export default function VolunteerKpiCards({ kpis, loading }: Props) {
  return (
    <div className="space-y-5">
      <MetricGroup
        title="Volunteer Metrics"
        specs={VOLUNTEER_KPI_SPECS}
        kpis={kpis}
        loading={loading}
        smColsClass="sm:grid-cols-3"
      />
      <MetricGroup
        title="Engagement Metrics"
        specs={ENGAGEMENT_KPI_SPECS}
        kpis={kpis}
        loading={loading}
        smColsClass="sm:grid-cols-2"
      />
      <MetricGroup
        title="Process Metrics"
        specs={PROCESS_KPI_SPECS}
        kpis={kpis}
        loading={loading}
        smColsClass="sm:grid-cols-3"
      />
    </div>
  );
}
