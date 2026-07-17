import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { siteConfig } from '@/config/site.config';
import { publicContentService } from '@/services/publicContentService';
import ContactContent from './ContactContent';
import { getLocalizedText } from '@/utils/localizedText';
import type { ContactContentFormData } from '@/types/public-content';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'ContactPage' });
    const pageData = await publicContentService.getPublicContact().catch(() => null);

    const title = pageData ? getLocalizedText(pageData.title, locale) || t('title') : t('title');
    const description = pageData ? getLocalizedText(pageData.description, locale) || t('subtitle') : t('subtitle');
    const canonical = pageData?.seo?.canonical_url || `/${locale}/contact`;

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
    const pageData = await publicContentService.getPublicContact().catch(() => null);

    // Fallback if data is completely empty
    const fallbackPage: ContactContentFormData = pageData || {
        title: { th: 'ติดต่อเรา', en: 'Contact Us', de: 'Kontakt' },
        description: { th: 'ติดต่อและแผนที่การเดินทาง', en: 'Contact details and directions', de: 'Kontaktdaten und Anfahrt' },
        seo: { title: { th: '', en: '', de: '' }, description: { th: '', en: '', de: '' }, keywords: { th: '', en: '', de: '' } },
        body: {
            address: { th: '', en: '', de: '' },
            phone: '',
            email: '',
            opening_hours: { days: { th: '', en: '', de: '' }, time: { th: '', en: '', de: '' }, notice: { th: '', en: '', de: '' } },
            map: { name: { th: '', en: '', de: '' }, embed_url: '', directions_url: '' },
            transport: { parking: { th: '', en: '', de: '' }, public_transport: [], driving: { th: '', en: '', de: '' } },
            socials: { facebook: '', instagram: '', messenger: '', line: '', youtube: '' },
            bank: { bank_name: { th: '', en: '', de: '' }, account_name: { th: '', en: '', de: '' }, account_number: '', iban: '', bic: '' },
            contact_form: { enabled: true, success_message: { th: '', en: '', de: '' }, privacy_page_link: '/privacy' }
        }
    };

    return <ContactContent locale={locale} cmsPage={fallbackPage} />;
}
