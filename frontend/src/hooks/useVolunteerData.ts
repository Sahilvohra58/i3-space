import { useMemo } from "react";
import type { VolunteerSnapshot } from "../api/volunteers";
import type { MetricKpi } from "../components/board/MetricKpiGrid";
import { useSnapshotData } from "./useSnapshotData";
import { VOLUNTEER_METRIC_KEYS } from "../components/board/categories/volunteerSpecs";

export interface VolunteerData {
  kpis: Record<string, MetricKpi>;
  trend: VolunteerSnapshot[];
  latestDate: string;
  hasData: boolean;
}

export function useVolunteerData(snapshots: VolunteerSnapshot[]): VolunteerData {
  const data = useSnapshotData(snapshots, [...VOLUNTEER_METRIC_KEYS]);

  return useMemo(
    () => ({
      kpis: data.kpis,
      trend: data.trend,
      latestDate: data.latestDate,
      hasData: data.hasData,
    }),
    [data],
  );
}
