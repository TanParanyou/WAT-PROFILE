import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin/',
                '/*/admin/',
                '/account/',
                '/*/account/',
                '/community/ask',
                '/*/community/ask',
                '/community/activity',
                '/*/community/activity',
                '/community/notifications',
                '/*/community/notifications',
                '/community/q/*/edit',
                '/*/community/q/*/edit',
                '/events/registrations/manage',
                '/*/events/registrations/manage',
                '/event-registrations/manage',
                '/*/event-registrations/manage',
            ],
        },
        sitemap: `${siteConfig.domain}/sitemap.xml`,
    };
}
