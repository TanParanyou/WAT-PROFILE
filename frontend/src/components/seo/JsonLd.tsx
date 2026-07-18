"use client";

import { siteConfig } from '@/config/site.config';
import { useLocale } from 'next-intl';
import { getLocalizedText } from '@/utils/localizedText';
import { usePublicSiteSettings } from '@/features/public/settings/PublicSiteSettingsProvider';

export default function JsonLd() {
    const locale = useLocale();
    const settings = usePublicSiteSettings();
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BuddhistTemple', // More specific than Organization
        name: getLocalizedText(settings.siteName, locale),
        alternateName: [settings.siteName.en, settings.siteName.de],
        url: siteConfig.domain,
        logo: `${siteConfig.domain}${siteConfig.logo.light}`,
        image: `${siteConfig.domain}${siteConfig.seo.defaultOgImage}`,
        description: getLocalizedText(settings.description, locale),
        telephone: settings.phone,
        email: settings.email,
        address: {
            '@type': 'PostalAddress',
            streetAddress: getLocalizedText(settings.address, locale),
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: siteConfig.contact.geo?.latitude,
            longitude: siteConfig.contact.geo?.longitude,
        },
        priceRange: '0', // Temples are usually free/donation based
        openingHoursSpecification: siteConfig.contact.openingHours?.map((hours) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: hours.dayOfWeek,
            opens: hours.opens,
            closes: hours.closes,
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
