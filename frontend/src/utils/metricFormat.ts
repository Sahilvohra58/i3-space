export type MetricType = "count" | "percent" | "currency" | "duration";

const compactNumber = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export function formatMetric(value: number, type: MetricType): string {
  switch (type) {
    case "percent":
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
    case "currency":
      return `$${compactNumber(value)}`;
    case "duration":
      return `${value.toLocaleString()} d`;
    case "count":
    default:
      return value.toLocaleString();
  }
}

export function formatDelta(delta: number, type: MetricType): string {
  const abs = Math.abs(delta);
  switch (type) {
    case "percent":
      return `${abs.toLocaleString(undefined, { maximumFractionDigits: 1 })}pp`;
    case "currency":
      return `$${compactNumber(abs)}`;
    case "duration":
      return `${abs.toLocaleString()} d`;
    case "count":
    default:
      return abs.toLocaleString();
  }
}
