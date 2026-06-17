/**
 * Tiny CSV export helpers — no extra dependency required.
 *
 * Rules (per RFC 4180):
 * - Fields containing commas, quotes, or newlines are wrapped in double quotes.
 * - Quotes inside fields are escaped by doubling them ("" instead of ").
 * - Rows are joined with CRLF so Excel/Numbers don't merge them on import.
 */

const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCell).join(",");
  const bodyLines = rows.map((row) => row.map(escapeCell).join(","));
  return [headerLine, ...bodyLines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM helps Excel auto-detect UTF-8 (handy if any cell ever contains accents)
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  // Append briefly so older browsers (and headless) respect the click
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Slugify a category name into a kebab-case filename component. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
