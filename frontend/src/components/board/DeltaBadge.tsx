import { formatDelta, type MetricType } from "../../utils/metricFormat";

interface Props {
  delta: number | null;
  // For some metrics (churn, time-to-fill, sales-cycle) lower is better,
  // so a downward delta should be green instead of red.
  goodWhenDown?: boolean;
  metricType?: MetricType;
}

export default function DeltaBadge({ delta, goodWhenDown = false, metricType = "count" }: Props) {
  if (delta === null) return <span className="text-gray-400">first snapshot</span>;
  if (delta === 0) return <span className="text-gray-400">no change</span>;

  const isUp = delta > 0;
  const isGood = goodWhenDown ? !isUp : isUp;
  const color = isGood ? "text-emerald-600" : "text-rose-600";
  const arrow = isUp ? "▲" : "▼";

  return (
    <span className={`${color} font-medium`}>
      {arrow} {formatDelta(delta, metricType)}
      <span className="text-gray-400 font-normal"> vs prev</span>
    </span>
  );
}
