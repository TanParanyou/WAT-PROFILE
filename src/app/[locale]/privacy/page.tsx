'use client';

import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
    const t = useTranslations('PrivacyPage');

    return (
        <div className="bg-white dark:bg-zinc-950 min-h-screen">
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
                <h1 className="text-4xl font-heading font-bold mb-8">{t('title')}</h1>
                <div className="prose prose-lg dark:prose-invert max-w-4xl">
                    <p className="text-gray-500">{t('lastUpdated')}: 2025-01-01</p>
                    {/* Placeholder content - typically long legal text */}
                    <p>
                        This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
                    </p>
                    <h2>Information Collection and Use</h2>
                    <p>
                        We collect several different types of information for various purposes to provide and improve our Service to you.
                    </p>
                    {/* Add more placeholder text as needed */}
                </div>
            </div>
        </div>
    );
}
