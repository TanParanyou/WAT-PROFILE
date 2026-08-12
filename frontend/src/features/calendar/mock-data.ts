import { entriesForRange } from "./range";
import type {
  CalendarEntry,
  CalendarFeed,
  CalendarLocale,
} from "./types";
import type { CalendarFeedRequest } from "./api";

interface MockCalendarEntry extends Omit<CalendarEntry, "title" | "detail"> {
  titles: Record<CalendarLocale, string>;
  description?: Record<CalendarLocale, string>;
  location?: string;
}

const mockEntries: readonly MockCalendarEntry[] = [
  {
    id: "retreat",
    source: "event",
    titles: { th: "ปฏิบัติธรรมประจำเดือน", en: "Monthly retreat", de: "Monatliche Meditation" },
    start: "2026-07-31",
    end: "2026-08-03",
    allDay: true,
    status: "active",
    display: { tone: "default" },
    description: { th: "กิจกรรมต่อเนื่องข้ามเดือน", en: "A multi-day event across a month boundary", de: "Eine mehrtägige Veranstaltung über eine Monatsgrenze" },
    location: "Main hall",
  },
  {
    id: "merit-morning",
    source: "event",
    titles: { th: "ทำบุญตอนเช้า", en: "Morning merit", de: "Morgenverdienst" },
    start: "2026-08-12",
    end: "2026-08-13",
    allDay: true,
    status: "active",
    display: { tone: "default" },
  },
  {
    id: "merit-noon",
    source: "event",
    titles: { th: "ถวายภัตตาหาร", en: "Offering lunch", de: "Mittagsgabe" },
    start: "2026-08-12",
    end: "2026-08-13",
    allDay: true,
    status: "active",
    display: { tone: "muted" },
  },
  {
    id: "merit-evening",
    source: "event",
    titles: { th: "สวดมนต์เย็น", en: "Evening chanting", de: "Abendgebet" },
    start: "2026-08-12",
    end: "2026-08-13",
    allDay: true,
    status: "active",
    display: { tone: "muted" },
  },
  {
    id: "merit-talk",
    source: "event",
    titles: { th: "สนทนาธรรม", en: "Dharma discussion", de: "Dharma-Gespräch" },
    start: "2026-08-12",
    end: "2026-08-13",
    allDay: true,
    status: "active",
    display: { tone: "warning" },
  },
  {
    id: "morning-overlap",
    source: "event",
    titles: { th: "อบรมอาสาสมัคร", en: "Volunteer training", de: "Freiwilligenschulung" },
    start: "2026-08-12T09:00:00+02:00",
    end: "2026-08-12T10:30:00+02:00",
    allDay: false,
    status: "active",
    display: { tone: "default" },
  },
  {
    id: "morning-overlap-2",
    source: "event",
    titles: { th: "ต้อนรับผู้มาเยือน", en: "Visitor welcome", de: "Besucherempfang" },
    start: "2026-08-12T09:30:00+02:00",
    end: "2026-08-12T11:00:00+02:00",
    allDay: false,
    status: "active",
    display: { tone: "warning" },
  },
  {
    id: "inactive-preview",
    source: "event",
    titles: { th: "กิจกรรมฉบับร่าง", en: "Draft activity", de: "Entwurf-Aktivität" },
    start: "2026-08-15",
    end: "2026-08-16",
    allDay: true,
    status: "inactive",
    display: { tone: "muted" },
  },
];

const defaultResource = { id: "default", title: "Calendar" } as const;

function materializeEntry(
  entry: MockCalendarEntry,
  input: CalendarFeedRequest,
): CalendarEntry {
  const canEdit = input.scope === "admin";
  return {
    id: entry.id,
    source: entry.source,
    title: entry.titles[input.locale],
    start: entry.start,
    end: entry.end,
    allDay: entry.allDay,
    resourceId: entry.resourceId,
    status: entry.status,
    display: entry.display,
    detail: {
      canEdit,
      href: `/events/${entry.id}`,
      editorHref: canEdit ? `/admin/events/${entry.id}` : undefined,
      description: entry.description?.[input.locale],
      location: entry.location,
    },
  };
}

export function getMockCalendarFeed(input: CalendarFeedRequest): CalendarFeed {
  const entries = mockEntries
    .filter((entry) => input.scope === "admin" || entry.status === "active")
    .map((entry) => materializeEntry(entry, input));

  return {
    scope: input.scope,
    locale: input.locale,
    timezone: "Europe/Berlin",
    range: input.range,
    entries: entriesForRange(entries, input.range),
    resources: [defaultResource],
  };
}
