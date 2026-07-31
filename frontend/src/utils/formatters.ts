export function formatDate(
  dateStr: string | Date | null | undefined,
  locale: string = "th",
): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString(locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US", {
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

  return date.toLocaleString(locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(
  timeStr: string | Date | null | undefined,
  locale: string = "th",
): string {
  if (!timeStr) return "-";

  if (timeStr instanceof Date) {
    return timeStr.toLocaleTimeString(locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  }

  const date = parseFlexibleDate(timeStr);
  if (!date) return "-";

  const localeTag = locale === "th" ? "th-TH" : locale === "de" ? "de-DE" : "en-US";
  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  };

  return date.toLocaleTimeString(localeTag, formatOptions);
}

export function formatTimeRange(
  startTime: string | Date | null | undefined,
  endTime: string | Date | null | undefined,
  locale: string = "th",
): string {
  const start = formatTime(startTime, locale);
  const end = formatTime(endTime, locale);

  if (start === "-" && end === "-") return "-";
  if (start !== "-" && end !== "-" && start !== end) return `${start} - ${end}`;
  return start !== "-" ? start : end;
}

export function toCalendarDateTime(
  date: string,
  time?: string | null,
): string {
  if (!date) return "";

  // Parse the date safely regardless of whether it's YYYY-MM-DD or an ISO string
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  // Format to YYYYMMDD using local time (or UTC if we want to be strict, but sticking to local is fine)
  // Let's extract exactly the parts from the ISO string to avoid timezone shifts
  const isoDate = date.includes("T") ? date.split("T")[0] : date;
  const [year, month, day] = isoDate.split("-");

  if (!time) {
    return `${year}${month}${day}`;
  }

  // Time might be HH:MM:SS or an ISO string like "2026-12-31T17:00:00Z"
  let isoTime = time;
  if (time.includes("T")) {
    isoTime = time.split("T")[1].replace("Z", "");
  }
  
  const [hour = "00", minute = "00", second = "00"] = isoTime.split(":");
  // Strip any decimal seconds
  const cleanSecond = second.split(".")[0];
  
  return `${year}${month}${day}T${hour}${minute}${cleanSecond}`;
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

function parseFlexibleDate(value: string): Date | null {
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  if (!isTimeOnlyValue(value)) {
    return null;
  }

  const [hours = "0", minutes = "0", seconds = "0"] = value.split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  const parsedSeconds = Number(seconds);

  if (
    Number.isNaN(parsedHours) ||
    Number.isNaN(parsedMinutes) ||
    Number.isNaN(parsedSeconds)
  ) {
    return null;
  }

  return new Date(Date.UTC(1970, 0, 1, parsedHours, parsedMinutes, parsedSeconds));
}

function isTimeOnlyValue(value: string): boolean {
  return /^\d{2}:\d{2}(:\d{2})?(?:\.\d+)?$/.test(value);
}
