import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import AboutContent from './AboutContent';
import { publicContentService } from '@/services/publicContentService';
import { buildPublicMetadata, normalizeSeo } from '@/features/public/seo/metadata';
import { getLocalizedText } from '@/utils/localizedText';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'AboutPage' });
    const page = await publicContentService.getPublicAbout().catch(() => null);
    return buildPublicMetadata({
        locale,
        pathname: `/${locale}/about`,
        seo: normalizeSeo(page?.seo),
        content: {
            title: page ? getLocalizedText(page.title, locale) : "",
            description: page ? getLocalizedText(page.description, locale) : "",
            image: page?.seo.og_image,
        },
        messages: { title: t('title'), description: t('missionDesc') },
    });
}

export default async function AboutPage() {
    return <AboutContent />;
}
