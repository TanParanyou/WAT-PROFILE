import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site.config';
import { fetchCommunityQuestionsServer } from '@/features/public/community/server-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const routes = [
        '',
        '/about',
        '/contact',
        '/events',
        '/gallery',
        '/monks',
        ...(process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === 'true' ? ['/community'] : []),
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

    if (process.env.NEXT_PUBLIC_COMMUNITY_ENABLED !== 'true') return sitemapEntries;

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
        return [...sitemapEntries, ...questionEntries];
    } catch {
        // Sitemap generation must not make a deploy fail when the API is unavailable.
        return sitemapEntries;
    }
}
