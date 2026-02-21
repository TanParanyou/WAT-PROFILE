import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import EventsContent from './EventsContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'EventsPage' });

    const title = t('title');
    const description = t('subtitle');

    return {
        title,
        description,
        openGraph: {
            title: `${title} | ${siteConfig.siteName.th}`,
            description,
            images: [{ url: siteConfig.seo.defaultOgImage, width: 1200, height: 630 }],
        },
        alternates: {
            canonical: `/${locale}/events`,
            languages: {
                th: '/th/events',
                en: '/en/events',
                de: '/de/events',
            },
        },
    };
}

export default function EventsPage() {
    return <EventsContent />;
}
