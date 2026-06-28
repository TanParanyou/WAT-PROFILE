import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import { websiteCmsPublicService } from '@/services/websiteCmsService';
import { getLocalizedText } from '@/utils/localizedText';
import { PublicAboutPageLayout } from '@/components/public/website/PublicAboutPageLayout';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'AboutPage' });
    const cmsPage = await websiteCmsPublicService.getPage('about').catch(() => null);
    const title = cmsPage ? getLocalizedText(cmsPage.title, locale) || t('title') : t('title');
    const description = cmsPage ? getLocalizedText(cmsPage.description, locale) || t('missionDesc') : t('missionDesc');

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
    const cmsPage = await websiteCmsPublicService.getPage('about').catch(() => null);
    return <PublicAboutPageLayout page={cmsPage} />;
}
