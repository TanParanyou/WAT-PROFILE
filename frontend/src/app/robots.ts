import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/account/', '/community/ask', '/community/activity', '/community/notifications', '/community/q/*/edit'],
        },
        sitemap: `${siteConfig.domain}/sitemap.xml`,
    };
}
