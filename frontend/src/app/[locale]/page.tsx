import React from "react";
import { publicService } from "@/services/publicService";
import { EventCard } from "@/components/public/EventCard";
import { MonkCard } from "@/components/public/MonkCard";
import { SectionLayout } from "@/components/public/SectionLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { ChevronRight } from "lucide-react";
import type { Event, Monk } from "@/types/entities";

export default async function PublicHomePage() {
  const locale = await getLocale();
  const t = await getTranslations("Public.home");

  // Fetch both concurrently
  const [eventsRes, monksRes] = await Promise.all([
    publicService.getLatestEvents(3),
    publicService.getMonks(),
  ]);

  const latestEvents = eventsRes?.data || [];
  const monks = monksRes?.data?.slice(0, 4) || []; // Show top 4 monks

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-md">
            {t("heroTitle")}
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-8 font-light max-w-2xl mx-auto drop-shadow">
            {t("heroSubtitle")}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/events"
              className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {t("exploreEvents")}
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Events Section */}
      <SectionLayout
        title={t("latestEvents")}
        subtitle={t("eventsSubtitle")}
        className="bg-gray-50"
        action={
          <Link
            href="/events"
            className="flex items-center gap-1 text-amber-600 font-semibold hover:text-amber-700 group"
          >
            {t("viewAll")}
            <ChevronRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {latestEvents.map((evt: Event) => (
            <EventCard key={evt.id} event={evt} locale={locale} />
          ))}
        </div>
      </SectionLayout>

      {/* Monks Section */}
      <SectionLayout
        title={t("monks")}
        subtitle={t("monksSubtitle")}
        className="bg-white"
        action={
          <Link
            href="/monks"
            className="flex items-center gap-1 text-amber-600 font-semibold hover:text-amber-700 group"
          >
            {t("viewAll")}
            <ChevronRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {monks.map((monk: Monk) => (
            <MonkCard key={monk.id} monk={monk} locale={locale} />
          ))}
        </div>
      </SectionLayout>
    </div>
  );
}
