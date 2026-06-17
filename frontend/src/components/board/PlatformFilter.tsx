import type { Platform } from "../../hooks/useBoardData";

export type PlatformFilter = Platform | "all";

const OPTIONS: { id: PlatformFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "twitter", label: "Twitter" },
];

interface Props {
  active: PlatformFilter;
  available: PlatformFilter[];
  onChange: (p: PlatformFilter) => void;
}

export default function PlatformFilter({ active, available, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.filter((o) => o.id === "all" || available.includes(o.id)).map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            active === o.id
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
