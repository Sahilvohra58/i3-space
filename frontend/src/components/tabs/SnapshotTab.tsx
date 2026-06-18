import { useEffect, useState } from "react";
import { invalidate as invalidateBoardCache } from "../../utils/boardCache";
import { toCsv, downloadCsv, slugify, todayStamp } from "../../utils/csvExport";

export interface SnapshotFieldSpec {
  key: string;
  label: string;
  /** integer vs decimal-allowed input */
  kind: "int" | "float";
  /** optional unit shown in the table cell (e.g. "%", " d") */
  suffix?: string;
  /** optional currency prefix (e.g. "$") */
  prefix?: string;
  /** minimum allowed value; defaults to 0 */
  min?: number;
}

export interface SnapshotBase {
  row_index: number;
  date: string;
}

interface SnapshotTabProps<TSnapshot extends SnapshotBase, TNew extends { date: string }> {
  title: string;
  fields: SnapshotFieldSpec[];
  fetchAll: () => Promise<TSnapshot[]>;
  add: (payload: TNew) => Promise<void>;
  remove: (rowIndex: number) => Promise<void>;
  /** Builds the empty form state */
  emptyForm: TNew;
}

const blockDecimalKeys = (e: React.KeyboardEvent<HTMLInputElement>, allowNegative = false) => {
  if (["e", "E", "+"].includes(e.key)) e.preventDefault();
  if (!allowNegative && e.key === "-") e.preventDefault();
};

const sanitize = (raw: string, kind: "int" | "float", min = 0) => {
  const n = Number(raw);
  if (Number.isNaN(n)) return min;
  if (kind === "int") return Math.max(min, Math.trunc(n));
  return Math.max(min, n);
};

const formatCell = (value: number, field: SnapshotFieldSpec) => {
  const base = field.kind === "int"
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${field.prefix ?? ""}${base}${field.suffix ?? ""}`;
};

export default function SnapshotTab<
  TSnapshot extends SnapshotBase,
  TNew extends { date: string },
>({ title, fields, fetchAll, add, remove, emptyForm }: SnapshotTabProps<TSnapshot, TNew>) {
  const [snapshots, setSnapshots] = useState<TSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TNew>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const fetchSnapshots = async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshots(await fetchAll());
    } catch {
      setError("Failed to load snapshots. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await add(form);
      // Optimistic append: the sheet appends at the end, so the new row_index
      // is one past the current max. This avoids a separate GET round-trip,
      // which saves us a Google Sheets read (the API caps at 60/min/user).
      const nextIndex = snapshots.length === 0
        ? 1
        : Math.max(...snapshots.map((s) => s.row_index)) + 1;
      const optimistic = { ...(form as unknown as Record<string, unknown>), row_index: nextIndex } as unknown as TSnapshot;
      setSnapshots((prev) => [...prev, optimistic]);
      setForm(emptyForm);
      setShowForm(false);
      invalidateBoardCache();
    } catch {
      setError("Failed to add snapshot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    setDeletingIndex(rowIndex);
    const prev = snapshots;
    setSnapshots((s) => s.filter((row) => row.row_index !== rowIndex));
    try {
      await remove(rowIndex);
      invalidateBoardCache();
    } catch {
      setError("Failed to delete snapshot.");
      setSnapshots(prev);
    } finally {
      setDeletingIndex(null);
    }
  };

  const displayedSnapshots = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));

  const colspan = fields.length + 2; // date + fields + delete column

  const handleExport = () => {
    // Export raw values (not the formatted display strings) so the CSV
    // is friendly for downstream analysis in Excel / Sheets.
    const headers = ["date", ...fields.map((f) => f.key)];
    const rows = displayedSnapshots.map((s) => [
      s.date,
      ...fields.map((f) => Number((s as Record<string, unknown>)[f.key] ?? 0)),
    ]);
    const csv = toCsv(headers, rows);
    downloadCsv(`${slugify(title)}-${todayStamp()}.csv`, csv);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={loading || displayedSnapshots.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={displayedSnapshots.length === 0 ? "Nothing to export yet" : "Download as CSV"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setForm(emptyForm);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Snapshot
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value } as TNew)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {fields.map((field) => {
            const current = (form as unknown as Record<string, number>)[field.key] ?? 0;
            const min = field.min ?? 0;
            const allowNegative = min < 0;
            return (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {field.label}
                  {field.prefix && <span className="text-gray-400"> ({field.prefix})</span>}
                  {field.suffix && <span className="text-gray-400"> ({field.suffix.trim()})</span>}
                </label>
                <input
                  type="number"
                  required
                  min={min}
                  step={field.kind === "int" ? 1 : "any"}
                  placeholder="0"
                  value={current || ""}
                  onKeyDown={field.kind === "int" ? (e) => {
                    blockDecimalKeys(e, allowNegative);
                    if (e.key === ".") e.preventDefault();
                  } : (e) => blockDecimalKeys(e, allowNegative)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      [field.key]: sanitize(e.target.value, field.kind, min),
                    } as unknown as TNew)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            );
          })}
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save Snapshot"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              {fields.map((f) => (
                <th key={f.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {f.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={colspan} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : displayedSnapshots.length === 0 ? (
              <tr>
                <td colSpan={colspan} className="px-4 py-10 text-center text-gray-400">
                  No snapshots yet. Click <strong>Add Snapshot</strong> to get started.
                </td>
              </tr>
            ) : (
              displayedSnapshots.map((s) => (
                <tr key={s.row_index} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{s.date}</td>
                  {fields.map((f) => (
                    <td key={f.key} className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {formatCell(Number((s as Record<string, unknown>)[f.key] ?? 0), f)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(s.row_index)}
                      disabled={deletingIndex === s.row_index}
                      title="Delete snapshot"
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && displayedSnapshots.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {displayedSnapshots.length} {displayedSnapshots.length === 1 ? "snapshot" : "snapshots"}
        </p>
      )}
    </div>
  );
}
