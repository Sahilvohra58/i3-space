interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: React.ReactNode;
}

export default function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900 leading-none truncate">{value}</p>
        {sub && <p className="mt-1 text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
}
