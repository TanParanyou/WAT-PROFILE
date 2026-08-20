import { differenceInYears } from "date-fns";

/**
 * Calculate monastic years (Pansa) from ordination date.
 * Returns null if no valid date is provided.
 */
export function calculatePansa(ordinationDate?: string | null): number | null {
  if (!ordinationDate) return null;
  const date = new Date(ordinationDate);
  if (isNaN(date.getTime())) return null;

  const now = new Date();
  // Monastic vassa is approximately annual from ordination
  const years = differenceInYears(now, date);
  return Math.max(0, years);
}
