'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';

export default function PrivacyPage() {
    const t = useTranslations('PrivacyPage');
    const tSite = useTranslations('Site');

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={`${t('lastUpdated')}: 2025-01-01`}
            />

            <PageContainer>
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-16">
                    <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
                        <p className="lead text-gray-600 dark:text-gray-300">
                            {t('introduction')}
                        </p>

                        <div className="my-8 h-px bg-gray-100 dark:bg-gray-800 w-full" />

                        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
                            {t('collectionTitle')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                            {t('collectionDesc')}
                        </p>

                        {/* 
                            Note: This is a simplified privacy policy for demonstration. 
                            In a real application, you would need to list all specific data collections, cookies, analytics, etc.
                            and potentially load this content from a markdown file or CMS if it's very long.
                        */}
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
