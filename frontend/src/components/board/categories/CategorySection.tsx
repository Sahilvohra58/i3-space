import MetricKpiGrid, { type MetricKpiSpec } from "../MetricKpiGrid";
import MiniChartGrid, { type MiniChartSpec } from "../MiniChartGrid";
import { useSnapshotData, type SnapshotLike } from "../../../hooks/useSnapshotData";

interface Props<T extends SnapshotLike> {
  title: string;
  snapshots: T[];
  kpiSpecs: MetricKpiSpec[];
  chartSpecs: MiniChartSpec[];
  loading: boolean;
  emptyStateTabName: string;
  /** Optional override for sm columns of KPI grid */
  smColsClass?: string;
  /** Optional override for lg columns of chart grid */
  chartColsClass?: string;
}

export default function CategorySection<T extends SnapshotLike>({
  title,
  snapshots,
  kpiSpecs,
  chartSpecs,
  loading,
  emptyStateTabName,
  smColsClass,
  chartColsClass,
}: Props<T>) {
  const metricKeys = kpiSpecs.map((s) => s.key);
  const data = useSnapshotData<T>(snapshots, metricKeys);

  return (
    <div className="pt-4 border-t border-gray-200 space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {data.hasData && (
          <span className="text-xs text-gray-400">Latest snapshot: {data.latestDate}</span>
        )}
      </div>

      {!data.hasData && !loading ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center text-sm text-gray-500">
          No snapshots yet — add one in the <strong>{emptyStateTabName}</strong> tab.
        </div>
      ) : (
        <>
          <MetricKpiGrid
            specs={kpiSpecs}
            values={data.kpis}
            loading={loading}
            smColsClass={smColsClass}
          />
          {!loading && (
            <MiniChartGrid
              data={data.trend}
              charts={chartSpecs}
              gridColsClass={chartColsClass}
            />
          )}
        </>
      )}
    </div>
  );
}
