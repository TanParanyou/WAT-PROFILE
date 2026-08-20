import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';
import { fetchCommunityQuestionsServer } from '@/features/public/community/server-api';
import { fetchPublicEvents } from '@/features/public/events/api';
import { fetchPublicMonks } from '@/features/public/monks/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const routes = [
        '',
        '/about',
        '/contact',
        '/events',
        '/calendar',
        '/gallery',
        '/monks',
        '/privacy',
        '/impressum',
        ...(process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === 'true' ? ['/community'] : []),
    ];

    // Get all static routes for all locales
    const staticEntries: MetadataRoute.Sitemap = routes.flatMap((route) => {
        return siteConfig.locales.map((locale) => {
            return {
                url: `${siteConfig.domain}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: (route === '' ? 'daily' : 'weekly') as MetadataRoute.Sitemap[number]['changeFrequency'],
                priority: route === '' ? 1.0 : 0.8,
            };
        });
    });

    const dynamicEntries: MetadataRoute.Sitemap = [];

    // Fetch dynamic events
    try {
        const events = await fetchPublicEvents();
        events.forEach((event) => {
            if (event.slug) {
                siteConfig.locales.forEach((locale) => {
                    dynamicEntries.push({
                        url: `${siteConfig.domain}/${locale}/events/${event.slug}`,
                        lastModified: event.start_date ? new Date(event.start_date) : new Date(),
                        changeFrequency: 'weekly' as const,
                        priority: 0.8,
                    });
                });
            }
        });
    } catch {
        // Continue if events API is unavailable during sitemap generation
    }

    // Fetch dynamic monks
    try {
        const monks = await fetchPublicMonks();
        monks.forEach((monk) => {
            if (monk.slug) {
                siteConfig.locales.forEach((locale) => {
                    dynamicEntries.push({
                        url: `${siteConfig.domain}/${locale}/monks/${monk.slug}`,
                        lastModified: new Date(),
                        changeFrequency: 'monthly' as const,
                        priority: 0.7,
                    });
                });
            }
        });
    } catch {
        // Continue if monks API is unavailable during sitemap generation
    }

    // Fetch community questions if enabled
    if (process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === 'true') {
        try {
            const allQuestions = [] as Awaited<ReturnType<typeof fetchCommunityQuestionsServer>>['items'];
            let cursor: string | undefined;
            for (let page = 0; page < 20; page += 1) {
                const questions = await fetchCommunityQuestionsServer({ limit: 50, cursor });
                allQuestions.push(...questions.items);
                if (!questions.next_cursor) break;
                cursor = questions.next_cursor;
            }
            const questionEntries = allQuestions.map((question) => ({
                url: `${siteConfig.domain}/${question.locale}/community/q/${question.id}/${question.slug}`,
                lastModified: new Date(question.last_activity_at),
                changeFrequency: 'daily' as const,
                priority: 0.7,
            }));
            dynamicEntries.push(...questionEntries);
        } catch {
            // Continue if community API is unavailable
        }
    }

    return [...staticEntries, ...dynamicEntries];
}

