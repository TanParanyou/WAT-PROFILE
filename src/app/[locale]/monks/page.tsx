'use client';

import { useTranslations, useLocale } from 'next-intl';
import monks from '@/data/monks.json';
import { Link } from '@/navigation';
import { getLocalizedText } from '@/utils/i18n';

import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import { ArrowRight } from 'lucide-react';

export default function MonksPage() {
    const t = useTranslations('MonksPage');
    const locale = useLocale();

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <PageContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {monks.map((monk) => (
                        <Link
                            key={monk.id}
                            href={`/monks/${monk.id}`}
                            className="group block bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800"
                        >
                            <div className="aspect-[3/4] overflow-hidden relative">
                                <img
                                    src={monk.image}
                                    alt={getLocalizedText(monk.name, locale)}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                <div className="absolute bottom-0 left-0 w-full p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <p className="text-sm font-medium text-primary-200 mb-1 opacity-90">
                                        {getLocalizedText(monk.title, locale)}
                                    </p>
                                    <h3 className="text-xl font-heading font-bold leading-tight">
                                        {getLocalizedText(monk.name, locale)}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-3 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity delay-100 text-primary-200">
                                        Read Bio <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </PageContainer>
        </div>
    );
}
