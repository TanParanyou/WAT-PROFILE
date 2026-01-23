'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Clock, MapPin } from 'lucide-react';
import events from '@/data/events.json';
import { Link } from '@/navigation';
import { getLocalizedText } from '@/utils/i18n';

import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
// Import ArrowRight as it wasn't there before
import { ArrowRight } from 'lucide-react';

export default function EventsPage() {
    const t = useTranslations('EventsPage');
    const locale = useLocale();

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <PageContainer>
                <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
                    {events.map((event) => (
                        <div key={event.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800 relative group overflow-hidden">
                            {/* Decorative accent */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>

                            {/* Date Box */}
                            <div className="shrink-0 flex md:flex-col items-center justify-center bg-gray-50 dark:bg-zinc-800/50 text-gray-800 dark:text-gray-200 rounded-2xl p-6 md:w-32 text-center border border-gray-100 dark:border-gray-700 group-hover:bg-primary/5 transition-colors">
                                <span className="text-4xl font-bold font-heading text-primary">{event.date.split('-')[2]}</span>
                                <span className="text-sm uppercase font-bold tracking-wider opacity-70 mt-1">{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</span>
                            </div>

                            <div className="grow">
                                <h2 className="text-2xl font-heading font-bold mb-4 group-hover:text-primary transition-colors">
                                    {getLocalizedText(event.title, locale)}
                                </h2>

                                <div className="flex flex-wrap gap-4 text-gray-500 dark:text-gray-400 mb-6 text-sm">
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                                        <Clock size={16} className="text-primary" />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                                        <MapPin size={16} className="text-primary" />
                                        <span>{getLocalizedText(event.location, locale)}</span>
                                    </div>
                                </div>

                                <Link href={`/events/${event.id}`} className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                                    {t('readMore')} <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </PageContainer>
        </div>
    );
}
