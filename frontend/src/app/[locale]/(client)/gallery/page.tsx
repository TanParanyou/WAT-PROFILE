import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import { websiteCmsPublicService } from '@/services/websiteCmsService';
import { getLocalizedText } from '@/utils/localizedText';
import GalleryContent from './GalleryContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'GalleryPage' });
    const cmsPage = await websiteCmsPublicService.getPage('gallery').catch(() => null);

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
            canonical: `/${locale}/gallery`,
            languages: {
                th: '/th/gallery',
                en: '/en/gallery',
                de: '/de/gallery',
            },
        },
    };
}

export default async function GalleryPage() {
    const cmsPage = await websiteCmsPublicService.getPage('gallery').catch(() => null);
    return <GalleryContent cmsPage={cmsPage} />;
}
