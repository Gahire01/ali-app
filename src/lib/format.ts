/**
 * Small date/time formatters used across the app. All output is
 * English-language and human-readable — no ISO strings leak to the UI.
 */

function safeDate(input: string | number | Date | null | undefined): Date | null {
  if (input === null || input === undefined) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "18:00" */
export function formatTime(input: string | number | Date): string {
  const d = safeDate(input);
  if (!d) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** "Mon, 20 Sep · 18:00" */
export function formatDayTime(input: string | number | Date): string {
  const d = safeDate(input);
  if (!d) return '—';
  const day = d.toLocaleDateString(undefined, { weekday: 'short' });
  const date = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  return `${day}, ${date} ${month} · ${formatTime(d)}`;
}

/** "20 Sep 2026 · 18:00" */
export function formatDateTime(input: string | number | Date): string {
  const d = safeDate(input);
  if (!d) return '—';
  const date = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  const year = d.getFullYear();
  return `${date} ${month} ${year} · ${formatTime(d)}`;
}

/** "just now" / "5m ago" / "3h ago" / "2d ago" / "20 Sep" */
export function formatRelativeTime(input: string | number | Date): string {
  const d = safeDate(input);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
