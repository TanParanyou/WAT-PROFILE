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
      <section className="grid min-h-[80svh] bg-[#fffef2] text-[#333] lg:grid-cols-2">
        <div className="flex items-center px-6 py-20 sm:px-10 lg:px-[8vw]">
          <div className="max-w-2xl">
          <h1 className="mb-6 max-w-[11ch] text-balance text-[clamp(2.9rem,6vw,5.8rem)] font-bold leading-[1.05] tracking-[-0.03em]">{heroTitle}</h1>
          <p className="mb-8 max-w-[65ch] text-lg leading-8 text-[#505050]">
            {heroSubtitle}
          </p>
          <div className="flex gap-4">
            <Link
              href={heroCtaHref}
              className="bg-[#333] px-6 py-[13px] font-semibold text-[#fffef2] transition-colors hover:bg-[#242424] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#945c26]"
            >
              {heroCtaLabel}
            </Link>
          </div>
          </div>
        </div>
        <div className="min-h-[26rem] bg-[url('/images/hero-bg.png')] bg-cover bg-center lg:min-h-full" />
      </section>

      <SectionLayout
        title={latestEventsTitle}
        subtitle={latestEventsSubtitle}
        className="border-t border-[#333] bg-[#fffef2]"
        action={
          <Link href="/events" className="group flex items-center gap-1 font-semibold text-[#945c26] hover:underline">
            {labels.viewAll}
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        }
      >
        <div className="grid grid-cols-1 border-t border-[#333] md:grid-cols-3">
          {latestEvents.map((event) => (
            <EventCard key={event.slug} event={event} locale={locale} />
          ))}
        </div>
      </SectionLayout>

      <SectionLayout
        title={monksTitle}
        subtitle={monksSubtitle}
        className="border-t border-[#333] bg-[#fffef2]"
        action={
          <Link href="/monks" className="group flex items-center gap-1 font-semibold text-[#945c26] hover:underline">
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
