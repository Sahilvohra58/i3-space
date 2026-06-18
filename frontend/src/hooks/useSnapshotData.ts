import { useMemo } from "react";
import type { MetricKpi } from "../components/board/MetricKpiGrid";

export interface SnapshotLike {
  row_index: number;
  date: string;
}

export interface SnapshotData<T extends SnapshotLike> {
  kpis: Record<string, MetricKpi>;
  trend: T[];
  latestDate: string;
  hasData: boolean;
}

const EMPTY_KPI: MetricKpi = { value: 0, delta: null };

export function useSnapshotData<T extends SnapshotLike>(
  snapshots: T[],
  metricKeys: string[],
): SnapshotData<T> {
  return useMemo(() => {
    if (snapshots.length === 0) {
      const empty: Record<string, MetricKpi> = {};
      metricKeys.forEach((k) => (empty[k] = EMPTY_KPI));
      return { kpis: empty, trend: [], latestDate: "—", hasData: false };
    }

    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    const kpis: Record<string, MetricKpi> = {};
    metricKeys.forEach((k) => {
      const current = Number((latest as Record<string, unknown>)[k] ?? 0);
      const previous = prev ? Number((prev as Record<string, unknown>)[k] ?? 0) : null;
      kpis[k] = {
        value: current,
        delta: previous === null ? null : current - previous,
      };
    });

    return {
      kpis,
      trend: sorted,
      latestDate: latest.date,
      hasData: true,
    };
  }, [snapshots, metricKeys.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
}
