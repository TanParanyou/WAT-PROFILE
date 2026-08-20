import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import { websiteCmsPublicService } from '@/services/websiteCmsService';
import { getLocalizedText } from '@/utils/localizedText';
import GalleryContent from './GalleryContent';
import { fetchPublishedPageMetadata } from '@/features/public/seo/api';
import { buildPublicMetadata, normalizeSeo } from '@/features/public/seo/metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'GalleryPage' });
    const cmsPage = await websiteCmsPublicService.getPage('gallery').catch(() => null);
    const apiPage = await fetchPublishedPageMetadata('gallery').catch(() => null);

    const title = apiPage ? getLocalizedText(apiPage.title, locale) : cmsPage ? getLocalizedText(cmsPage.title, locale) : '';
    const description = apiPage ? getLocalizedText(apiPage.description, locale) : cmsPage ? getLocalizedText(cmsPage.description, locale) : '';
    return buildPublicMetadata({
        locale,
        pathname: `/${locale}/gallery`,
        seo: normalizeSeo(apiPage?.seo),
        content: { title, description },
        messages: { title: t('title'), description: t('subtitle') },
    });
}

export default async function GalleryPage() {
    const cmsPage = await websiteCmsPublicService.getPage('gallery').catch(() => null);
    return <GalleryContent cmsPage={cmsPage} />;
}
