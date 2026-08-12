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
import { usePublicSiteSettingsQuery } from '@/features/public/settings/queries';
import { PublicImage } from '@/components/public/media/PublicImage';
import { MonkLineArt } from '@/components/public/illustrations/MonkLineArt';

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
  const siteSettingsQuery = usePublicSiteSettingsQuery();
  const heroSection = pickSection(page?.sections, ['hero'], 'hero');
  const featuredEventsSection = pickSection(page?.sections, ['featured-events'], 'event_teaser');
  const featuredMonksSection = pickSection(page?.sections, ['featured-monks'], 'monk_teaser');

  const heroTitle = getLocalizedText(page?.title, locale) || '';
  const heroSubtitle = sectionText(heroSection, 'description', locale) || getLocalizedText(page?.description, locale) || '';
  const heroCtaLabel = sectionText(heroSection, 'settings.cta_label', locale) || labels.exploreEvents;
  const heroCtaHref = sectionText(heroSection, 'settings.cta_href', locale) || '/events';

  const heroImageRaw = getPathValue(heroSection, 'body.image');
  const heroImageFromCms = sectionText(heroSection, 'body.image', locale) || (typeof heroImageRaw === 'string' ? heroImageRaw : '');
  const heroBgUrl = heroImageFromCms || siteSettingsQuery.data?.hero_bg_url?.trim() || '/images/hero-bg.png';

  const latestEventsTitle =
    sectionText(featuredEventsSection, 'title', locale) || labels.latestEvents;
  const latestEventsSubtitle =
    sectionText(featuredEventsSection, 'description', locale) || labels.eventsSubtitle;

  const monksTitle = sectionText(featuredMonksSection, 'title', locale) || labels.monks;
  const monksSubtitle =
    sectionText(featuredMonksSection, 'description', locale) || labels.monksSubtitle;

  return (
    <div className="flex min-h-screen flex-col">
      <section className="relative overflow-hidden bg-[#FFFEF2] text-site-foreground border-b border-site-border/30">
        <div className="mx-auto grid max-w-[1440px] items-center lg:grid-cols-2 lg:min-h-[calc(100vh-4.5rem)]">
          {/* Unified Content Section for Mobile */}
          <div className="relative z-10 flex flex-col justify-center px-6 pt-24 pb-16 sm:px-10 lg:px-[8vw] lg:py-20">
            <div className="max-w-2xl">
              {/* 1. Eyebrow */}
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-[#C88D1E]" />
                <p className="text-xs font-semibold uppercase tracking-widest text-[#966B18]">
                  วัดหลวงพ่อใส
                </p>
              </div>

              {/* 2. Heading */}
              <h1 className="max-w-[11ch] text-balance font-heading text-[clamp(2.4rem,6.5vw,5.6rem)] font-bold leading-[1.06] tracking-[-0.03em] text-[#2C221E]">
                {heroTitle}
              </h1>

              {/* 3. Description */}
              <p className="mt-4 max-w-[55ch] text-base leading-relaxed text-[#5C504A] sm:text-lg lg:mt-6 lg:leading-8">
                {heroSubtitle}
              </p>

              {/* 4. CTA */}
              <div className="mt-7 sm:mt-9">
                <Link
                  href={heroCtaHref}
                  className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#2C221E] px-7 py-3 text-sm font-semibold text-[#FFFEF2] transition-all hover:bg-[#42342E] hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                  {heroCtaLabel}
                </Link>
              </div>
            </div>

            {/* Minimal Line-Art Monk anchored at bottom-right corner on mobile */}
            <div className="absolute right-3 bottom-1 z-0 pointer-events-none opacity-80 sm:right-8 sm:bottom-2 lg:hidden">
              <MonkLineArt className="h-36 w-36 sm:h-48 sm:w-48 text-[#C88D1E]/75" />
            </div>
          </div>

          {/* Desktop Image Section */}
          <div className="hidden relative h-full min-h-[26rem] w-full overflow-hidden bg-site-surface lg:block">
            <PublicImage
              src={heroBgUrl}
              alt={heroTitle || 'Hero background'}
              fallbackSrc="/images/hero-bg.png"
              fill
              priority
              sizes="50vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <SectionLayout
        title={latestEventsTitle}
        subtitle={latestEventsSubtitle}
        className="border-t border-site-border bg-site-canvas"
        action={
          <Link href="/events" className="group flex items-center gap-1 font-semibold text-site-accent hover:underline">
            {labels.viewAll}
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        }
      >
        <div className="grid grid-cols-1 border-t border-site-border md:grid-cols-3">
          {latestEvents.map((event) => (
            <EventCard key={event.slug} event={event} locale={locale} />
          ))}
        </div>
      </SectionLayout>

      <SectionLayout
        title={monksTitle}
        subtitle={monksSubtitle}
        className="border-t border-site-border bg-site-canvas"
        action={
          <Link href="/monks" className="group flex items-center gap-1 font-semibold text-site-accent hover:underline">
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
