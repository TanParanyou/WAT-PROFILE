import { useLocale, useTranslations } from "next-intl";
import { Clock, Calendar, Video } from "lucide-react";
import { getLocalizedText } from "../mappers";
import type { PublicScheduleDto } from "../types";
import { formatTimeRange } from "@/utils/formatters";

interface SchedulesSectionProps {
  schedules: readonly PublicScheduleDto[];
}

export function SchedulesSection({ schedules }: SchedulesSectionProps) {
  const locale = useLocale();
  const t = useTranslations("EventsPage");

  const sortedSchedules = [...schedules].sort((left, right) => left.display_order - right.display_order);
  const daily = sortedSchedules.filter((schedule) => schedule.schedule_type === "daily");
  const weekly = sortedSchedules.filter((schedule) => schedule.schedule_type === "weekly");
  const online = sortedSchedules.filter((schedule) => schedule.schedule_type === "online");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {daily.length > 0 ? <section className="border border-site-border bg-site-canvas p-6">
        <div className="mb-4 flex items-center gap-3">
          <Clock className="text-site-accent" size={20} />
          <h3 className="text-lg font-bold">{t("dailySchedule")}</h3>
        </div>
        <div className="space-y-4">
          {daily.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 border-b border-site-border pb-3 last:border-0">
              <div className="text-sm text-site-muted">
                {formatTimeRange(item.time_start, item.time_end, locale)}
              </div>
              <div className="text-sm text-site-body">{getLocalizedText(item.activity, locale)}</div>
            </div>
          ))}
        </div>
      </section> : null}
      <div className="space-y-8">
        {weekly.length > 0 ? <section className="border border-site-border bg-site-canvas p-6">
          <div className="mb-4 flex items-center gap-3">
          <Calendar className="text-site-accent" size={20} />
            <h3 className="text-lg font-bold">{t("weeklySchedule")}</h3>
          </div>
          <div className="space-y-4">
            {weekly.map((item) => (
              <div key={item.id} className="border-b border-site-border pb-3 last:border-0">
                <div className="font-medium text-site-foreground">{getDayLabel(item.day_of_week, t)}</div>
                <div className="text-sm text-site-muted">
                  {formatTimeRange(item.time_start, item.time_end, locale)}
                </div>
                <div className="text-sm text-site-body">{getLocalizedText(item.activity, locale)}</div>
              </div>
            ))}
          </div>
        </section> : null}
        {online.length > 0 ? <section className="border border-site-border bg-site-surface p-6">
          <div className="mb-3 flex items-center gap-3">
          <Video className="text-site-accent" size={20} />
            <h3 className="text-lg font-bold">{t("onlineSchedule")}</h3>
          </div>
          <div className="space-y-3">
            {online.map((item) => (
              <div key={item.id} className="space-y-1 text-sm text-site-body">
                <div>{getLocalizedText(item.activity, locale)}</div>
                {item.online_link ? (
                  <a
                    href={item.online_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-site-accent hover:underline"
                  >
                    {t("joinOnline")}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section> : null}
      </div>
    </div>
  );
}

const dayKeys = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DayNameKey = `dayNames.${(typeof dayKeys)[number]}`;

function getDayLabel(
  dayOfWeek: number | null,
  translate: (key: DayNameKey) => string,
): string {
  if (dayOfWeek === null || !Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return "-";
  }

  return translate(`dayNames.${dayKeys[dayOfWeek]}`);
}
