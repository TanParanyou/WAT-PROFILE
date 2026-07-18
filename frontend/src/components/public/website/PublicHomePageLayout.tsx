'use client';

import { ChevronRight } from 'lucide-react';
import { Link } from '@/navigation';
import type { PublicEventDto } from '@/features/public/events/types';
import type { PublicMonkDto } from '@/features/public/monks/types';
import type { PublicContentPage } from '@/types/website-cms';
import { getLocalizedText } from '@/utils/localizedText';
import { SectionLayout } from '@/components/public/SectionLayout';
import { EventCard } from '@/components/public/EventCard';
import { MonkCard } from '@/components/public/MonkCard';

export function PublicHomePageLayout({
  page,
  locale,
  latestEvents,
  monks,
  labels,
}: {
  page: PublicContentPage | null;
  locale: string;
  latestEvents: PublicEventDto[];
  monks: PublicMonkDto[];
  labels: {
    exploreEvents: string;
    latestEvents: string;
    eventsSubtitle: string;
    monks: string;
    monksSubtitle: string;
    viewAll: string;
  };
}) {
  const heroSection = pickSection(page?.sections, ['hero'], 'hero');
  const featuredEventsSection = pickSection(page?.sections, ['featured-events'], 'event_teaser');
  const featuredMonksSection = pickSection(page?.sections, ['featured-monks'], 'monk_teaser');

  const heroTitle = getLocalizedText(page?.title, locale) || '';
  const heroSubtitle = sectionText(heroSection, 'description', locale) || getLocalizedText(page?.description, locale) || '';
  const heroCtaLabel = sectionText(heroSection, 'settings.cta_label', locale) || labels.exploreEvents;
  const heroCtaHref = sectionText(heroSection, 'settings.cta_href', locale) || '/events';

  const latestEventsTitle =
    sectionText(featuredEventsSection, 'title', locale) || labels.latestEvents;
  const latestEventsSubtitle =
    sectionText(featuredEventsSection, 'description', locale) || labels.eventsSubtitle;

  const monksTitle = sectionText(featuredMonksSection, 'title', locale) || labels.monks;
  const monksSubtitle =
    sectionText(featuredMonksSection, 'description', locale) || labels.monksSubtitle;

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative flex h-[80vh] items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h1 className="mb-6 text-4xl font-extrabold text-white drop-shadow-md md:text-6xl">{heroTitle}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg font-light text-gray-200 drop-shadow md:text-2xl">
            {heroSubtitle}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href={heroCtaHref}
              className="transform rounded-full bg-amber-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-amber-700 hover:shadow-xl"
            >
              {heroCtaLabel}
            </Link>
          </div>
        </div>
      </section>

      <SectionLayout
        title={latestEventsTitle}
        subtitle={latestEventsSubtitle}
        className="bg-gray-50"
        action={
          <Link href="/events" className="group flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700">
            {labels.viewAll}
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {latestEvents.map((event) => (
            <EventCard key={event.slug} event={event} locale={locale} />
          ))}
        </div>
      </SectionLayout>

      <SectionLayout
        title={monksTitle}
        subtitle={monksSubtitle}
        className="bg-white"
        action={
          <Link href="/monks" className="group flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700">
            {labels.viewAll}
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {monks.map((monk) => (
            <MonkCard key={monk.slug} monk={monk} locale={locale} />
          ))}
        </div>
      </SectionLayout>
    </div>
  );
}

function pickSection(sections: PublicContentPage['sections'] | undefined, keys: string[], type?: string) {
  if (!sections?.length) return null;
  return sections.find((section) => keys.includes(section.section_key) || (type ? section.section_type === type : false)) ?? null;
}

function sectionText(section: ReturnType<typeof pickSection>, path: string, locale: string) {
  if (!section) return '';
  const value = getPathValue(section, path);
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (isRecord(value)) return getLocalizedText(value, locale);
  return '';
}

function getPathValue(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (!isRecord(acc)) return undefined;
    return acc[key];
  }, source);
}

function isRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null &&
    Object.values(value).every((item) => typeof item === 'string');
}
