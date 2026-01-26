/**
 * Date formatting utilities.
 */

/**
 * Supported date format types.
 */
export type DateFormat = "long" | "short";

/**
 * Format a date string to a human-readable format.
 *
 * @param dateString - ISO date string to format
 * @param format - Format type: "long" (e.g., "January 15, 2024") or "short" (e.g., "Jan 15, 2024")
 * @returns Formatted date string
 *
 * @example
 * formatDate("2024-01-15T10:30:00Z", "long")  // "January 15, 2024"
 * formatDate("2024-01-15T10:30:00Z", "short") // "Jan 15, 2024"
 */
export function formatDate(
  dateString: string,
  format: DateFormat = "long"
): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: format,
    day: "numeric",
  });
}
