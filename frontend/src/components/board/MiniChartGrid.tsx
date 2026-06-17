import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface MiniChartSpec {
  title: string;
  dataKey: string;
  color: string;
  unitSuffix?: string;
  unitPrefix?: string;
}

interface Props<T extends { date: string }> {
  data: T[];
  charts: MiniChartSpec[];
  /** Tailwind grid template for >= lg breakpoint; defaults to 3 cols */
  gridColsClass?: string;
}

export default function MiniChartGrid<T extends { date: string }>({
  data,
  charts,
  gridColsClass = "lg:grid-cols-3",
}: Props<T>) {
  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
      {charts.map((c) => (
        <div key={c.dataKey} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">{c.title}</h3>
          {data.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center text-sm text-gray-400">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip
                  formatter={(v) => [`${c.unitPrefix ?? ""}${v}${c.unitSuffix ?? ""}`, c.title]}
                  labelFormatter={(l) => `Date: ${l}`}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey={c.dataKey}
                  stroke={c.color}
                  strokeWidth={2}
                  dot={{ r: 3.5, strokeWidth: 0, fill: c.color }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      ))}
    </div>
  );
}
