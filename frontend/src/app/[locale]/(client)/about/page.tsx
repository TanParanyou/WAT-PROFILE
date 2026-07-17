import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import { publicContentService } from '@/services/publicContentService';
import { getLocalizedText } from '@/utils/localizedText';
import { PublicAboutPageLayout } from '@/components/public/website/PublicAboutPageLayout';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'AboutPage' });
    const pageData = await publicContentService.getPublicAbout().catch(() => null);
    const title = pageData ? getLocalizedText(pageData.title, locale) || t('title') : t('title');
    const description = pageData ? getLocalizedText(pageData.description, locale) || t('missionDesc') : t('missionDesc');

    return {
        title,
        description,
        openGraph: {
            title: `${title} | ${siteConfig.siteName.th}`,
            description,
            images: [{ url: siteConfig.seo.defaultOgImage, width: 1200, height: 630 }],
        },
        alternates: {
            canonical: `/${locale}/about`,
            languages: {
                th: '/th/about',
                en: '/en/about',
                de: '/de/about',
            },
        },
    };
}

export default async function AboutPage() {
    const pageData = await publicContentService.getPublicAbout().catch(() => null);
    return <PublicAboutPageLayout page={pageData} />;
}
