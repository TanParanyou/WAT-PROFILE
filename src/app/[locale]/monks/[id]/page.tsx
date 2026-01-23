'use client';

import { use } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import monks from '@/data/monks.json';
import { notFound } from 'next/navigation';
import { getLocalizedText } from '@/utils/i18n';

import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';

interface Props {
    params: Promise<{
        id: string;
    }>
}

export default function MonkDetailPage({ params }: Props) {
    const { id } = use(params);
    const t = useTranslations('MonksPage');
    const locale = useLocale();

    const monk = monks.find(m => m.id === id);

    if (!monk) {
        notFound();
    }

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <div className="pt-24 pb-12">
                <PageContainer>
                    <Link
                        href="/monks"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-8 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Monks History
                    </Link>

                    <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                            {/* Image Section - Left Side */}
                            <div className="md:col-span-5 lg:col-span-4 relative h-[400px] md:h-auto">
                                <img
                                    src={monk.image}
                                    alt={getLocalizedText(monk.name, locale)}
                                    className="w-full h-full object-cover absolute inset-0"
                                />
                            </div>

                            {/* Content Section - Right Side */}
                            <div className="md:col-span-7 lg:col-span-8 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                                <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold tracking-wide w-fit mb-4">
                                    {getLocalizedText(monk.title, locale)}
                                </span>

                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-8">
                                    {getLocalizedText(monk.name, locale)}
                                </h1>

                                <div
                                    className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                                    dangerouslySetInnerHTML={{ __html: getLocalizedText(monk.content, locale) }}
                                />
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </div>
        </div>
    );
}
