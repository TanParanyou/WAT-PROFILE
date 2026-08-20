import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: `${siteConfig.siteName.th} | ${siteConfig.siteName.en}`,
        short_name: siteConfig.siteShortName || siteConfig.siteName.th,
        description: siteConfig.seo.defaultDescription,
        start_url: '/th?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#ffffff',
        theme_color: siteConfig.theme.colorPrimary,
        categories: ['lifestyle', 'education', 'religion'],
        lang: 'th',
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-maskable-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
        shortcuts: [
            {
                name: 'ปฏิทินกิจกรรม / Buddhist Calendar',
                short_name: 'ปฏิทิน',
                description: 'ดูกิจกรรมและวันสำคัญทางพระพุทธศาสนา',
                url: '/th/calendar?source=pwa_shortcut',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
            },
            {
                name: 'ติดต่อวัด / Contact',
                short_name: 'ติดต่อวัด',
                description: 'ข้อมูลการติดต่อและแผนที่วัด',
                url: '/th/contact?source=pwa_shortcut',
                icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
            },
        ],
    };
}

