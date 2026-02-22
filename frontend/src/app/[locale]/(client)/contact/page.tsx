import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import ContactContent from './ContactContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ContactPage' });

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
            canonical: `/${locale}/contact`,
            languages: {
                th: '/th/contact',
                en: '/en/contact',
                de: '/de/contact',
            },
        },
    };
}

export default function ContactPage() {
    return <ContactContent />;
}
