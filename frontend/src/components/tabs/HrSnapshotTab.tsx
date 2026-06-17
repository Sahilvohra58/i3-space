import { useEffect, useState } from "react";
import {
  getVolunteerSnapshots,
  upsertVolunteerSnapshot,
  deleteVolunteerSnapshot,
  type VolunteerSnapshot,
} from "../../api/volunteers";
import { invalidate as invalidateBoardCache } from "../../utils/boardCache";
import { mergeVolunteerSnapshot } from "../../utils/hrVolunteerMerge";
import { toCsv, downloadCsv, slugify, todayStamp } from "../../utils/csvExport";
import type { SnapshotFieldSpec } from "./SnapshotTab";

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

interface Props {
  title: string;
  fields: SnapshotFieldSpec[];
  emptyForm: Record<string, string | number>;
}

export default function HrSnapshotTab({ title, fields, emptyForm }: Props) {
  const [snapshots, setSnapshots] = useState<VolunteerSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const fetchSnapshots = async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshots(await getVolunteerSnapshots());
    } catch {
      setError("Failed to load snapshots. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const date = String(form.date);
      const existing = snapshots.find((s) => s.date === date);
      const partial = { date, ...Object.fromEntries(fields.map((f) => [f.key, Number(form[f.key] ?? 0)])) };
      const merged = mergeVolunteerSnapshot(existing, partial);
      await upsertVolunteerSnapshot(merged);

      setSnapshots((prev) => {
        if (existing) {
          return prev.map((s) => (s.date === date ? { ...s, ...merged, row_index: s.row_index } : s));
        }
        const nextIndex = prev.length === 0 ? 1 : Math.max(...prev.map((s) => s.row_index)) + 1;
        return [...prev, { ...merged, row_index: nextIndex }];
      });
      setForm(emptyForm);
      setShowForm(false);
      invalidateBoardCache();
    } catch {
      setError("Failed to save snapshot.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    setDeletingIndex(rowIndex);
    const prev = snapshots;
    setSnapshots((s) => s.filter((row) => row.row_index !== rowIndex));
    try {
      await deleteVolunteerSnapshot(rowIndex);
      invalidateBoardCache();
    } catch {
      setError("Failed to delete snapshot.");
      setSnapshots(prev);
    } finally {
      setDeletingIndex(null);
    }
  };

  const displayedSnapshots = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));
  const colspan = fields.length + 2;

  const handleExport = () => {
    const headers = ["date", ...fields.map((f) => f.key)];
    const rows = displayedSnapshots.map((s) => [s.date, ...fields.map((f) => Number(s[f.key] ?? 0))]);
    downloadCsv(`${slugify(title)}-${todayStamp()}.csv`, toCsv(headers, rows));
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
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setForm(emptyForm);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
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
              value={String(form.date ?? "")}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {fields.map((field) => {
            const current = Number(form[field.key] ?? 0);
            const min = field.min ?? 0;
            const allowNegative = min < 0;
            return (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
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
                    setForm({ ...form, [field.key]: sanitize(e.target.value, field.kind, min) })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            );
          })}
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60">
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
              <tr><td colSpan={colspan} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : displayedSnapshots.length === 0 ? (
              <tr><td colSpan={colspan} className="px-4 py-10 text-center text-gray-400">No snapshots yet. Click <strong>Add Snapshot</strong> to get started.</td></tr>
            ) : (
              displayedSnapshots.map((s) => (
                <tr key={s.row_index} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{s.date}</td>
                  {fields.map((f) => (
                    <td key={f.key} className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {formatCell(Number(s[f.key] ?? 0), f)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(s.row_index)}
                      disabled={deletingIndex === s.row_index}
                      title="Delete snapshot"
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
