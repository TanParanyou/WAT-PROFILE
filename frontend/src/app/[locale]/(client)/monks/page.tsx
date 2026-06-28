import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import { websiteCmsPublicService } from '@/services/websiteCmsService';
import { getLocalizedText } from '@/utils/localizedText';
import MonksContent from './MonksContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'MonksPage' });
    const cmsPage = await websiteCmsPublicService.getPage('monks').catch(() => null);

    const title = cmsPage ? getLocalizedText(cmsPage.title, locale) || t('title') : t('title');
    const description = cmsPage ? getLocalizedText(cmsPage.description, locale) || t('subtitle') : t('subtitle');

    return {
        title,
        description,
        openGraph: {
            title: `${title} | ${siteConfig.siteName.th}`,
            description,
            images: [{ url: siteConfig.seo.defaultOgImage, width: 1200, height: 630 }],
        },
        alternates: {
            canonical: `/${locale}/monks`,
            languages: {
                th: '/th/monks',
                en: '/en/monks',
                de: '/de/monks',
            },
        },
    };
}

export default async function MonksPage() {
    const cmsPage = await websiteCmsPublicService.getPage('monks').catch(() => null);
    return <MonksContent cmsPage={cmsPage} />;
}
