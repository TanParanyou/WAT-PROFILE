import MonksContent from './MonksContent';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site.config';
import { fetchPublishedPageMetadata } from '@/features/public/seo/api';
import { buildPublicMetadata, normalizeSeo } from '@/features/public/seo/metadata';
import { getLocalizedText } from '@/utils/localizedText';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MonksPage' });
    const page = await fetchPublishedPageMetadata('monks').catch(() => null);
    return buildPublicMetadata({
        locale,
        pathname: `/${locale}/monks`,
        seo: normalizeSeo(page?.seo),
        content: {
            title: page ? getLocalizedText(page.title, locale) : '',
            description: page ? getLocalizedText(page.description, locale) : '',
        },
        messages: { title: t('title'), description: t('subtitle') },
    });
}

export default async function MonksPage() {
    return <MonksContent />;
}
