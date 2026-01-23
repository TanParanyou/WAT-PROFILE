'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';

export default function PrivacyPage() {
    const t = useTranslations('PrivacyPage');

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={t('lastUpdated') + ': 2025-01-01'}
            />

            <PageContainer>
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-16">
                    <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
                        <p className="lead text-gray-600 dark:text-gray-300">
                            This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
                        </p>

                        <div className="my-8 h-px bg-gray-100 dark:bg-gray-800 w-full" />

                        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
                            Information Collection and Use
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                            We collect several different types of information for various purposes to provide and improve our Service to you.
                        </p>

                        {/* More sections would go here */}
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
