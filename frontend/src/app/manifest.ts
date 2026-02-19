import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: siteConfig.siteName.th, // Default to Thai name
        short_name: siteConfig.siteShortName,
        description: siteConfig.seo.defaultDescription,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: siteConfig.theme.colorPrimary,
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
