'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Clock, MapPin } from 'lucide-react';
import events from '@/data/events.json';
import { Link } from '@/navigation';
import { getLocalizedText } from '@/utils/i18n';

export default function EventsPage() {
    const t = useTranslations('EventsPage');
    const locale = useLocale();

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            {/* Header */}
            <div className="bg-primary text-white pt-40 pb-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">{t('title')}</h1>
                    <p className="text-xl font-light opacity-90">{t('subtitle')}</p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
                <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                    {events.map((event) => (
                        <div key={event.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-sm border border-gray-100 dark:border-gray-800">
                            {/* Date Box */}
                            <div className="shrink-0 flex md:flex-col items-center justify-center bg-primary/5 text-primary rounded-xl p-4 md:w-32 text-center border border-primary/10">
                                <span className="text-4xl font-bold font-heading">{event.date.split('-')[2]}</span>
                                <span className="text-sm uppercase font-medium">{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</span>
                            </div>

                            <div className="grow">
                                <h2 className="text-2xl font-heading font-bold mb-3">{getLocalizedText(event.title, locale)}</h2>

                                <div className="space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} />
                                        <span>{getLocalizedText(event.location, locale)}</span>
                                    </div>
                                </div>

                                <Link href={`/events/${event.id}`} className="inline-block px-6 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors">
                                    {t('readMore')}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
