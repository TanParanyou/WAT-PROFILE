import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { startOfMonth } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { siteConfig } from '@/config/site.config';
import EventsContent from './EventsContent';
import { fetchPublishedPageMetadata } from '@/features/public/seo/api';
import { buildPublicMetadata, normalizeSeo } from '@/features/public/seo/metadata';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { fetchPublicEvents, fetchPublicSchedules } from '@/features/public/events/api';
import { publicEventsKeys } from '@/features/public/events/queries';
import { getMonthGridRange } from '@/features/calendar/calendar-domain';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'EventsPage' });

    const page = await fetchPublishedPageMetadata('events').catch(() => null);
    return buildPublicMetadata({ locale, pathname: `/${locale}/events`, seo: normalizeSeo(page?.seo), content: { title: page ? page.title[locale as keyof typeof page.title] ?? '' : '', description: page ? page.description[locale as keyof typeof page.description] ?? '' : '' }, messages: { title: t('title'), description: t('subtitle') }, site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage } });
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const queryClient = new QueryClient();
    const weekStartsOn: 0 | 1 = locale === 'th' ? 0 : 1;
    const currentBerlinMonth = startOfMonth(toZonedTime(new Date(), 'Europe/Berlin'));
    const visibleRange = getMonthGridRange(currentBerlinMonth, weekStartsOn);
    const visibleRangeOptions = { from: visibleRange.startDate, to: visibleRange.endDate };

    // Prefetch events and schedules for hydration
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: publicEventsKeys.list(),
            queryFn: () => fetchPublicEvents(),
        }),
        queryClient.prefetchQuery({
            queryKey: publicEventsKeys.list(visibleRangeOptions),
            queryFn: () => fetchPublicEvents(visibleRangeOptions),
        }),
        queryClient.prefetchQuery({
            queryKey: publicEventsKeys.schedules(),
            queryFn: () => fetchPublicSchedules(),
        })
    ]);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <EventsContent />
        </HydrationBoundary>
    );
}
