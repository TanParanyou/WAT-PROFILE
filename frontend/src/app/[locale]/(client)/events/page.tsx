import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import EventsContent from './EventsContent';
import { fetchPublishedPageMetadata } from '@/features/public/seo/api';
import { buildPublicMetadata, normalizeSeo } from '@/features/public/seo/metadata';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { fetchPublicEvents, fetchPublicSchedules } from '@/features/public/events/api';
import { publicEventsKeys } from '@/features/public/events/queries';

import { getLocalizedText } from '@/utils/localizedText';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'EventsPage' });

    const page = await fetchPublishedPageMetadata('events').catch(() => null);
    return buildPublicMetadata({
        locale,
        pathname: `/${locale}/events`,
        seo: normalizeSeo(page?.seo),
        content: {
            title: page ? getLocalizedText(page.title, locale) : '',
            description: page ? getLocalizedText(page.description, locale) : '',
        },
        messages: { title: t('title'), description: t('subtitle') },
    });
}

export default async function EventsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const messages = await getMessages({ locale });
    const queryClient = new QueryClient();
    // Prefetch events and schedules for hydration
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: publicEventsKeys.list(),
            queryFn: () => fetchPublicEvents(),
        }),
        queryClient.prefetchQuery({
            queryKey: publicEventsKeys.schedules(),
            queryFn: () => fetchPublicSchedules(),
        })
    ]);

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <EventsContent />
            </HydrationBoundary>
        </NextIntlClientProvider>
    );
}
