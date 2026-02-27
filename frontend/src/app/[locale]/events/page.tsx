import React from "react";
import { publicService } from "@/services/publicService";
import { EventCard } from "@/components/public/EventCard";
import { SectionLayout } from "@/components/public/SectionLayout";
import { getLocale, getTranslations } from "next-intl/server";
import type { Event } from "@/types/entities";

export default async function PublicEventsPage() {
  const locale = await getLocale();
  const t = await getTranslations("Public.events");

  // Notice we can increase limit or handle pagination securely on the server
  const res = await publicService.getLatestEvents(20);
  const events: Event[] = res?.data || [];

  return (
    <SectionLayout
      title={t("title")}
      subtitle={t("subtitle")}
      className="min-h-screen pt-24"
    >
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((evt) => (
            <EventCard key={evt.id} event={evt} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-lg">{t("noEvents")}</p>
        </div>
      )}
    </SectionLayout>
  );
}
