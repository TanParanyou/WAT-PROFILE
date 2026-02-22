import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import GalleryContent from './GalleryContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'GalleryPage' });

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
            canonical: `/${locale}/gallery`,
            languages: {
                th: '/th/gallery',
                en: '/en/gallery',
                de: '/de/gallery',
            },
        },
    };
}

export default function GalleryPage() {
    return <GalleryContent />;
}
