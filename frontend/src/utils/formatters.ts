export function formatDate(
  dateStr: string | Date | null | undefined,
  locale: string = "th",
): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateRange(
  startDateStr: string | Date | null | undefined,
  endDateStr: string | Date | null | undefined,
  locale: string = "th",
): string {
  if (!startDateStr) return "-";
  const start = formatDate(startDateStr, locale);
  const end = endDateStr ? formatDate(endDateStr, locale) : "";

  if (start === end || !end || end === "-") return start;
  return `${start} - ${end}`;
}

export function formatDateTime(
  dateStr: string | Date | null | undefined,
  locale: string = "th",
): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "-";
  const parsed = Number(num);
  if (isNaN(parsed)) return "-";

  return parsed.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatCurrency(
  num: number | string | null | undefined,
  currency: string = "THB",
): string {
  if (num === null || num === undefined) return "-";
  const parsed = Number(num);
  if (isNaN(parsed)) return "-";

  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: currency,
  }).format(parsed);
}
