import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCalendarFeed, type CalendarFeedRequest } from "./api";

export const calendarKeys = {
  feed: (
    scope: CalendarFeedRequest["scope"],
    locale: CalendarFeedRequest["locale"],
    range: CalendarFeedRequest["range"],
  ) => ["calendar", scope, locale, range.startDate, range.endDate] as const,
};

export function useCalendarEntries(input: CalendarFeedRequest) {
  return useQuery({
    queryKey: calendarKeys.feed(input.scope, input.locale, input.range),
    queryFn: () => fetchCalendarFeed(input),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
