import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        '',
        '/about',
        '/contact',
        '/events',
        '/gallery',
        '/monks',
    ];

    // Get all static routes for all locales
    const sitemapEntries = routes.flatMap((route) => {
        return siteConfig.locales.map((locale) => {
            return {
                url: `${siteConfig.domain}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: route === '' ? 1 : 0.8,
            };
        });
    });

    return sitemapEntries;
}
