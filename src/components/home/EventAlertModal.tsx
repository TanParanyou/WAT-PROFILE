'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/navigation';
import { X, Calendar, MapPin, Clock } from 'lucide-react';
import events from '@/data/events.json';
import { getLocalizedText } from '@/utils/i18n';

export default function EventAlertModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [upcomingEvent, setUpcomingEvent] = useState<typeof events[0] | null>(null);
    const t = useTranslations('EventsSection'); // Reusing translation namespace
    const locale = useLocale();

    useEffect(() => {
        const checkEvents = () => {
            const today = new Date().toISOString().split('T')[0];

            // Find the first upcoming event
            const nextEvent = events
                .filter(event => event.date >= today)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

            if (!nextEvent) return;

            // Check if this specific event has been dismissed recently
            const lastDismissed = localStorage.getItem(`event-alert-dismissed-${nextEvent.id}`);
            if (lastDismissed) {
                const dismissedDate = new Date(parseInt(lastDismissed));
                const now = new Date();
                // Check if 24 hours have passed
                const hoursSinceDismissal = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
                if (hoursSinceDismissal < 24) {
                    return;
                }
            }

            setUpcomingEvent(nextEvent);
            // Show with a slight delay
            const timer = setTimeout(() => setIsOpen(true), 2000);
            return () => clearTimeout(timer);
        };

        checkEvents();
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        if (upcomingEvent) {
            // Save dismissal with timestamp
            localStorage.setItem(`event-alert-dismissed-${upcomingEvent.id}`, Date.now().toString());
        }
    };

    if (!upcomingEvent) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Image Header */}
                        <div className="relative h-56 bg-zinc-200 dark:bg-zinc-800">
                            {/* Placeholder for real image */}
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-zinc-400">
                                [Image: {upcomingEvent.image}]
                            </div>

                            {/* Date Badge */}
                            <div className="absolute bottom-4 left-4 bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-full text-xs font-bold text-primary shadow-lg flex items-center gap-1.5">
                                <Calendar size={14} />
                                {upcomingEvent.date}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 md:p-8">
                            <h3 className="text-2xl font-heading font-bold text-zinc-900 dark:text-white mb-3">
                                {getLocalizedText(upcomingEvent.title, locale)}
                            </h3>

                            <div className="flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} className="text-primary" />
                                    <span>{upcomingEvent.time}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} className="text-primary" />
                                    <span>{getLocalizedText(upcomingEvent.location, locale)}</span>
                                </div>
                            </div>

                            <p className="text-zinc-600 dark:text-zinc-300 mb-8 line-clamp-3 leading-relaxed">
                                {getLocalizedText(upcomingEvent.description, locale)}
                            </p>

                            <Link
                                href={`/events/${upcomingEvent.id}`}
                                className="block w-full text-center py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                {t('readMore')}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
