import { siteConfig } from '@/config/site.config';
import { getLocale } from 'next-intl/server';
import { getLocalizedText } from '@/utils/localizedText';
import { fetchPublicSiteSettings } from '@/features/public/settings/api';
import { getFallbackPublicSiteSettings, mapPublicSiteSettings } from '@/features/public/settings/mapper';

import { toAbsoluteUrl } from '@/utils/url';

export default async function JsonLd() {
    let locale = 'th';
    try {
        locale = await getLocale();
    } catch {
        locale = siteConfig.defaultLocale;
    }

    let settings = getFallbackPublicSiteSettings();
    try {
        const raw = await fetchPublicSiteSettings();
        settings = mapPublicSiteSettings(raw, settings);
    } catch {
        // Fallback to siteConfig
    }

    const templeName = getLocalizedText(settings.siteName, locale) || siteConfig.siteName.th;
    const templeDescription = getLocalizedText(settings.description, locale) || siteConfig.seo.defaultDescription;
    const templeAddress = getLocalizedText(settings.address, locale) || (siteConfig.contact.address ? getLocalizedText(siteConfig.contact.address, locale) : '');

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BuddhistTemple',
        name: templeName,
        alternateName: [settings.siteName.th, settings.siteName.en, settings.siteName.de].filter(Boolean),
        url: siteConfig.domain,
        logo: toAbsoluteUrl(settings.logoUrl || siteConfig.logo.light),
        image: toAbsoluteUrl(siteConfig.seo.defaultOgImage),
        description: templeDescription,
        telephone: settings.phone || siteConfig.contact.phone,
        email: settings.email || siteConfig.contact.email,
        address: {
            '@type': 'PostalAddress',
            streetAddress: templeAddress,
            addressLocality: siteConfig.contact.addressDetails?.addressLocality,
            postalCode: siteConfig.contact.addressDetails?.postalCode,
            addressCountry: siteConfig.contact.addressDetails?.addressCountry,
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: siteConfig.contact.geo?.latitude,
            longitude: siteConfig.contact.geo?.longitude,
        },
        priceRange: '0',
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
