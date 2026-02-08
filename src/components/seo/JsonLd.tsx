import { siteConfig } from '@/config/site.config';

export default function JsonLd() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BuddhistTemple', // More specific than Organization
        name: siteConfig.siteName.th,
        alternateName: [siteConfig.siteName.en, siteConfig.siteName.de],
        url: siteConfig.domain,
        logo: `${siteConfig.domain}${siteConfig.logo.light}`,
        image: `${siteConfig.domain}${siteConfig.seo.defaultOgImage}`,
        description: siteConfig.seo.defaultDescription,
        telephone: siteConfig.contact.phone,
        email: siteConfig.contact.email,
        address: {
            '@type': 'PostalAddress',
            streetAddress: siteConfig.contact.addressDetails?.streetAddress,
            addressLocality: siteConfig.contact.addressDetails?.addressLocality,
            postalCode: siteConfig.contact.addressDetails?.postalCode,
            addressCountry: siteConfig.contact.addressDetails?.addressCountry,
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
