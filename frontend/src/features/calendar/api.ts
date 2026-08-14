import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import adminApi from "@/services/adminApi";
import { publicApi } from "@/services/publicService";
import type {
  CalendarEntry,
  CalendarFeed,
  CalendarLocale,
  CalendarRange,
  CalendarResource,
  CalendarScope,
} from "./types";

export interface CalendarFeedRequest {
  scope: CalendarScope;
  locale: CalendarLocale;
  range: CalendarRange;
}

export const CALENDAR_MAX_RANGE_DAYS = 93;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isDateOnly(value: unknown): value is string {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

export function validateCalendarFeedRange(range: CalendarRange): void {
  if (!isDateOnly(range.startDate) || !isDateOnly(range.endDate)) {
    throw new Error("Invalid calendar feed range");
  }
  const start = parseISO(range.startDate);
  const end = parseISO(range.endDate);
  const inclusiveDays = differenceInCalendarDays(end, start) + 1;
  if (inclusiveDays < 1 || inclusiveDays > CALENDAR_MAX_RANGE_DAYS) {
    throw new Error(`Calendar feed range must be between 1 and ${CALENDAR_MAX_RANGE_DAYS} days`);
  }
}

function isDateTime(value: unknown): value is string {
  if (!isString(value) || value.length === 0) return false;
  const parsed = parseISO(value);
  return isValid(parsed);
}

function parseCalendarEntry(value: unknown): CalendarEntry | null {
  if (!isRecord(value)) return null;
  const display = value.display;
  const detail = value.detail;
  if (!isRecord(display) || !isRecord(detail)) return null;
  if (
    !isString(value.id) ||
    !isString(value.source) ||
    !isString(value.title) ||
    typeof value.allDay !== "boolean" ||
    (value.status !== "active" && value.status !== "inactive") ||
    (display.tone !== "default" && display.tone !== "muted" && display.tone !== "warning") ||
    typeof detail.canEdit !== "boolean" ||
    !isOptionalString(value.resourceId) ||
    !isOptionalString(detail.href) ||
    !isOptionalString(detail.editorHref) ||
    !isOptionalString(detail.description) ||
    !isOptionalString(detail.location)
  ) {
    return null;
  }

  const validStart = value.allDay ? isDateOnly(value.start) : isDateTime(value.start);
  const validEnd = value.allDay ? isDateOnly(value.end) : isDateTime(value.end);
  if (!validStart || !validEnd || !isString(value.start) || !isString(value.end)) return null;

  return {
    id: value.id,
    source: value.source,
    title: value.title,
    start: value.start,
    end: value.end,
    allDay: value.allDay,
    resourceId: value.resourceId,
    status: value.status,
    display: { tone: display.tone },
    detail: {
      href: detail.href,
      editorHref: detail.editorHref,
      canEdit: detail.canEdit,
      description: detail.description,
      location: detail.location,
    },
  };
}

function parseCalendarResource(value: unknown): CalendarResource | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title)) return null;
  if (!isOptionalString(value.color)) return null;
  return { id: value.id, title: value.title, color: value.color };
}

function parseCalendarFeed(payload: unknown): CalendarFeed {
  if (!isRecord(payload) || payload.success !== true || !isRecord(payload.data)) {
    throw new Error("Invalid calendar feed envelope");
  }

  const data = payload.data;
  const range = data.range;
  if (
    (data.scope !== "public" && data.scope !== "admin") ||
    (data.locale !== "th" && data.locale !== "en" && data.locale !== "de") ||
    data.timezone !== "Europe/Berlin" ||
    !isRecord(range) ||
    !isDateOnly(range.startDate) ||
    !isDateOnly(range.endDate) ||
    !Array.isArray(data.entries) ||
    !Array.isArray(data.resources)
  ) {
    throw new Error("Invalid calendar feed metadata");
  }

  const entries = data.entries.map(parseCalendarEntry);
  const resources = data.resources.map(parseCalendarResource);
  if (entries.some((entry) => entry === null) || resources.some((resource) => resource === null)) {
    throw new Error("Invalid calendar feed entry");
  }

  return {
    scope: data.scope,
    locale: data.locale,
    timezone: data.timezone,
    range: { startDate: range.startDate, endDate: range.endDate },
    entries: entries.filter((entry): entry is CalendarEntry => entry !== null),
    resources: resources.filter((resource): resource is CalendarResource => resource !== null),
  };
}

export async function fetchCalendarFeedFromApi(
  input: CalendarFeedRequest,
): Promise<CalendarFeed> {
  validateCalendarFeedRange(input.range);
  const client = input.scope === "public" ? publicApi : adminApi;
  const path = input.scope === "public" ? "/calendar" : "/admin/calendar";
  const response = await client.get<unknown>(path, {
    params: {
      from: input.range.startDate,
      to: input.range.endDate,
      locale: input.locale,
    },
  });
  return parseCalendarFeed(response.data);
}

export async function fetchCalendarFeed(
  input: CalendarFeedRequest,
): Promise<CalendarFeed> {
  return fetchCalendarFeedFromApi(input);
}
