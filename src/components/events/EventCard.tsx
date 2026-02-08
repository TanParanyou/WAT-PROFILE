'use client';

import { MapPin, Clock } from 'lucide-react';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { getLocalizedText } from '@/utils/i18n';
import { LocalizedText } from '@/config/site.config';

type Event = {
    id: number;
    active: boolean;
    title: LocalizedText;
    date: string;
    time: string;
    location: LocalizedText;
    image: string;
    description: LocalizedText;
    schedule: any[];
    mapUrl: string;
    order?: number;
};

type EventCardProps = {
    event: Event;
    index: number;
};

export default function EventCard({ event, index }: EventCardProps) {
    const t = useTranslations('EventsSection');
    const locale = useLocale();
    const format = useFormatter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            className="flex-none w-full md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] snap-start bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col h-auto"
        >
            <div className="h-48 bg-gray-200 dark:bg-zinc-700 relative overflow-hidden group">
                <img
                    src={event.image}
                    alt={getLocalizedText(event.title, locale)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                    {format.dateTime(new Date(event.date), { dateStyle: 'medium' })}
                </div>
            </div>

            <div className="p-6 flex flex-col grow">
                <h3 className="text-xl font-heading font-bold mb-3 text-gray-800 dark:text-gray-100 line-clamp-2">
                    {getLocalizedText(event.title, locale)}
                </h3>

                <div className="space-y-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-primary/70 shrink-0" />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary/70 shrink-0" />
                        <span>{getLocalizedText(event.location, locale)}</span>
                    </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 grow">
                    {getLocalizedText(event.description, locale)}
                </p>

                <Link
                    href={`/events/${event.id}`}
                    className="block w-full text-center py-2.5 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors font-medium text-sm mt-auto"
                >
                    {t('readMore')}
                </Link>
            </div>
        </motion.div>
    );
}
