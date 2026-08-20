import { getTranslations } from "next-intl/server";
import { fetchPublicEvents } from "@/features/public/events/api";
import EventsGridMotion from "@/components/home/EventsGridMotion";
import { EmptyState } from "@/components/public/states/EmptyState";

export type ScheduleItem = {
  time: string;
  title: { th: string; en: string; de: string };
  description?: { th: string; en: string; de: string };
};

export default async function EventsSection({ locale }: { locale: string }) {
  const t = await getTranslations("EventsSection");
  const state = await getTranslations("PublicState");
  
  const events = await fetchPublicEvents({ limit: 3 }).catch(() => []);

  return (
    <section className="border-t border-site-border bg-site-canvas px-6 py-[clamp(4rem,9vw,8rem)] text-site-foreground sm:px-10 lg:px-[8vw]">
      <div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <p className="text-sm text-site-muted">{t("subtitle")}</p>
          <h2 className="max-w-[16ch] text-balance font-heading text-[clamp(2.3rem,4.8vw,4.7rem)] font-normal leading-[1.14]">
            {t("title")}
          </h2>
        </div>
        <div className="mt-16">
          {events.length > 0 ? (
            <EventsGridMotion events={events} locale={locale} />
          ) : (
            <EmptyState title={state("emptyEvents")} description={state("emptyContent")} />
          )}
        </div>
      </div>
    </section>
  );
}
