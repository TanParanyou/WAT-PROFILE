import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import EventsContent from './EventsContent';
import { fetchPublishedPageMetadata } from '@/features/public/seo/api';
import { buildPublicMetadata, normalizeSeo } from '@/features/public/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'EventsPage' });

    const page = await fetchPublishedPageMetadata('events').catch(() => null);
    return buildPublicMetadata({ locale, pathname: `/${locale}/events`, seo: normalizeSeo(page?.seo), content: { title: page ? page.title[locale as keyof typeof page.title] ?? '' : '', description: page ? page.description[locale as keyof typeof page.description] ?? '' : '' }, messages: { title: t('title'), description: t('subtitle') }, site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage } });
}

export default function EventsPage() {
    return <EventsContent />;
}
