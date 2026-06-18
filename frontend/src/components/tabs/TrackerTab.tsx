import { useEffect, useState } from "react";
import {
  getTrackerRows,
  addTrackerRow,
  deleteTrackerRow,
  getChannels,
  addChannel,
  type TrackerRow,
  type NewTrackerRow,
} from "../../api/tracker";
import { invalidate as invalidateBoardCache } from "../../utils/boardCache";
import { toCsv, downloadCsv, todayStamp } from "../../utils/csvExport";

const EMPTY_FORM: NewTrackerRow = {
  date: "",
  channel_name: "",
  views: 0,
  minutes_watched: 0,
};

export default function TrackerTab() {
  const [rows, setRows] = useState<TrackerRow[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewTrackerRow>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [addingChannel, setAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const fetchRows = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await getTrackerRows());
    } catch {
      setError("Failed to load entries. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    getChannels()
      .then(setChannels)
      .catch(() => setChannels([]));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addTrackerRow(form);
      // Optimistic append to avoid a redundant GET (Google Sheets read-quota).
      const nextIndex = rows.length === 0
        ? 1
        : Math.max(...rows.map((r) => r.row_index)) + 1;
      setRows((prev) => [...prev, { ...form, row_index: nextIndex }]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      invalidateBoardCache();
    } catch {
      setError("Failed to add entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddChannel = async () => {
    const name = newChannelName.trim();
    if (!name) return;
    try {
      await addChannel(name);
      setChannels((prev) => [...prev, name].sort());
      setForm((f) => ({ ...f, channel_name: name }));
    } catch {
      setError("Failed to add channel.");
    } finally {
      setNewChannelName("");
      setAddingChannel(false);
    }
  };

  const handleDelete = async (rowIndex: number) => {
    setDeletingIndex(rowIndex);
    const prev = rows;
    setRows((r) => r.filter((row) => row.row_index !== rowIndex));
    try {
      await deleteTrackerRow(rowIndex);
      invalidateBoardCache();
    } catch {
      setError("Failed to delete entry.");
      setRows(prev);
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleExport = () => {
    const headers = ["date", "channel_name", "views", "minutes_watched"];
    const exportRows = rows.map((r) => [r.date, r.channel_name, r.views, r.minutes_watched]);
    downloadCsv(`youtube-tracker-${todayStamp()}.csv`, toCsv(headers, exportRows));
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">YouTube Tracker</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={loading || rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={rows.length === 0 ? "Nothing to export yet" : "Download as CSV"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setForm(EMPTY_FORM);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Entry
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add row form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Channel Name</label>
            {addingChannel ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  type="text"
                  placeholder="Channel name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddChannel(); }
                    if (e.key === "Escape") { setAddingChannel(false); setNewChannelName(""); }
                  }}
                  className="flex-1 min-w-0 rounded-lg border border-indigo-400 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={handleAddChannel}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingChannel(false); setNewChannelName(""); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                required
                value={form.channel_name}
                onChange={(e) => {
                  if (e.target.value === "__add_new__") {
                    setAddingChannel(true);
                    setForm({ ...form, channel_name: "" });
                  } else {
                    setForm({ ...form, channel_name: e.target.value });
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="" disabled>Select a channel…</option>
                {channels.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
                <option value="__add_new__">+ Add channel</option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Views</label>
            <input
              type="number"
              required
              min={0}
              step={1}
              placeholder="0"
              value={form.views || ""}
              onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
              onChange={(e) => setForm({ ...form, views: Math.max(0, Math.trunc(Number(e.target.value))) })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Minutes Watched</label>
            <input
              type="number"
              required
              min={0}
              step={1}
              placeholder="0"
              value={form.minutes_watched || ""}
              onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
              onChange={(e) => setForm({ ...form, minutes_watched: Math.max(0, Math.trunc(Number(e.target.value))) })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-2 justify-end">
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
              {submitting ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Date", "Channel Name", "Views", "Minutes Watched", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No entries yet. Click <strong>Add Entry</strong> to get started.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.row_index} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.date}</td>
                  <td className="px-4 py-3 text-gray-700">{row.channel_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {row.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {row.minutes_watched.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(row.row_index)}
                      disabled={deletingIndex === row.row_index}
                      title="Delete entry"
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

      {!loading && rows.length > 0 && (
        <p className="text-xs text-gray-400 text-right">{rows.length} {rows.length === 1 ? "entry" : "entries"}</p>
      )}
    </div>
  );
}
