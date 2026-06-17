import { useState } from "react";

export type DatePreset = "all" | "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  preset: DatePreset;
  start: string; // ISO date string or ""
  end: string;   // ISO date string or ""
}

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all",    label: "All" },
  { id: "7d",     label: "7d" },
  { id: "30d",    label: "30d" },
  { id: "90d",    label: "90d" },
  { id: "custom", label: "Custom" },
];

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function presetToRange(preset: DatePreset, customStart = "", customEnd = ""): DateRange {
  switch (preset) {
    case "7d":     return { preset, start: daysAgo(7),  end: isoToday() };
    case "30d":    return { preset, start: daysAgo(30), end: isoToday() };
    case "90d":    return { preset, start: daysAgo(90), end: isoToday() };
    case "custom": return { preset, start: customStart, end: customEnd };
    default:       return { preset: "all", start: "", end: "" };
  }
}

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

export default function DateRangeFilter({ value, onChange }: Props) {
  const [customStart, setCustomStart] = useState(value.start);
  const [customEnd, setCustomEnd] = useState(value.end);

  const handlePreset = (preset: DatePreset) => {
    if (preset === "custom") {
      onChange({ preset: "custom", start: customStart, end: customEnd });
    } else {
      onChange(presetToRange(preset));
    }
  };

  const handleCustomApply = () => {
    onChange({ preset: "custom", start: customStart, end: customEnd });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm flex items-start gap-4 col-span-2 lg:col-span-1">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <CalendarIcon />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Date Range</p>

        {/* Preset pills */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePreset(p.id)}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition ${
                value.preset === p.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {value.preset === "custom" && (
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(e) => setCustomStart(e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="text-xs text-gray-400">→</span>
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="flex-1 min-w-0 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <button
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
              className="self-end rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        )}

        {/* Active range label for non-custom presets */}
        {value.preset !== "all" && value.preset !== "custom" && value.start && (
          <p className="mt-1.5 text-xs text-gray-400 truncate">
            {value.start} → {value.end}
          </p>
        )}
      </div>
    </div>
  );
}
