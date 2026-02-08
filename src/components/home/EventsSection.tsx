'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import events from '@/data/events.json';
import { LocalizedText } from '@/config/site.config';
import EventCard from '@/components/events/EventCard';

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

export default function EventsSection() {
    const t = useTranslations('EventsSection');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
        }
    };

    const activeEvents = (events as Event[])
        .filter(e => e.active)
        .sort((a, b) => (a.order || 999) - (b.order || 999));

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

                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={scrollLeft}
                                className="p-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors"
                                aria-label="Previous"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={scrollRight}
                                className="p-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors"
                                aria-label="Next"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <Link
                            href="/events"
                            className="text-primary hover:text-primary/80 font-medium items-center gap-2 group transition-colors hidden md:flex"
                        >
                            {t('viewAll')} <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </div>

                <div className="relative">
                    <style jsx global>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                        .no-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                        }
                    `}</style>

                    <div
                        ref={scrollContainerRef}
                        className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 no-scrollbar"
                    >
                        {activeEvents.map((event, index) => (
                            <EventCard key={event.id} event={event} index={index} />
                        ))}
                    </div>
                </div>

                <div className="md:hidden flex justify-center mt-4">
                    <Link
                        href="/events"
                        className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 group transition-colors"
                    >
                        {t('viewAll')} <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
