/**
 * Splits an appointment date string into the two lines of the calendar badge.
 *
 * Handles "AY GG" shapes like "TEM 26" or legacy "OCT 08" (month on top,
 * day at the bottom). Any other string (no space, empty, multi-word without
 * a clear month/day pair) is rendered whole on the top line so "undefined"
 * never appears in the UI.
 */
export function parseDateBadge(dateStr: string | null | undefined): { top: string; bottom: string } {
  const raw = (dateStr ?? "").trim();
  if (!raw) return { top: "—", bottom: "" };

  const match = raw.match(/^(\S+)\s+(\S+)$/);
  if (match) {
    return { top: match[1], bottom: match[2] };
  }
  return { top: raw, bottom: "" };
}
