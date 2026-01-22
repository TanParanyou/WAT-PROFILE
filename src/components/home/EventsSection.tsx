'use client';

import { MapPin, Clock } from 'lucide-react';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import events from '@/data/events.json';
import { getLocalizedText } from '@/utils/i18n';

export default function EventsSection() {
    const t = useTranslations('EventsSection');
    const locale = useLocale();

    return (
        <section className="py-20 bg-zinc-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-gray-800">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-2">
                            {t('title')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 font-sans">
                            {t('subtitle')}
                        </p>
                    </div>
                    <Link
                        href="/events"
                        className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 group transition-colors"
                    >
                        {t('viewAll')} <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            viewport={{ once: true }}
                            className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 flex flex-col h-full"
                        >
                            {/* Image Placeholder */}
                            <div className="h-48 bg-gray-200 dark:bg-zinc-700 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500">
                                    {/* Real implementation would use Next.js Image component */}
                                    [Image: {event.image}]
                                </div>
                                <div className="absolute top-4 right-4 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                                    {event.date}
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
                                    className="block w-full text-center py-2.5 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    {t('readMore')}
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
