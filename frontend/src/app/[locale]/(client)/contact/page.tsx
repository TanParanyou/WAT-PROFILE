import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import { websiteCmsPublicService } from '@/services/websiteCmsService';
import ContactContent from './ContactContent';
import { getLocalizedText } from '@/utils/localizedText';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ContactPage' });
    const cmsPage = await websiteCmsPublicService.getPage('contact').catch(() => null);

    const title = cmsPage ? getLocalizedText(cmsPage.title, locale) || t('title') : t('title');
    const description = cmsPage ? getLocalizedText(cmsPage.description, locale) || t('subtitle') : t('subtitle');
    const canonical = cmsPage?.seo?.canonical_url || `/${locale}/contact`;

    return {
        title,
        description,
        openGraph: {
            title: `${title} | ${siteConfig.siteName.th}`,
            description,
            images: [{ url: siteConfig.seo.defaultOgImage, width: 1200, height: 630 }],
        },
        alternates: {
            canonical,
            languages: {
                th: '/th/contact',
                en: '/en/contact',
                de: '/de/contact',
            },
        },
    };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cmsPage = await websiteCmsPublicService.getPage('contact').catch(() => null);
    return <ContactContent locale={locale} cmsPage={cmsPage} />;
}
