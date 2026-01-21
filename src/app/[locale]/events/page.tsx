'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Clock, MapPin } from 'lucide-react';

// Mock data (reuse struct)
const events = [
    {
        id: 1,
        title: { th: 'พิธีทำบุญตักบาตรวันมาฆบูชา', en: 'Makha Bucha Day Ceremony' },
        date: '2025-02-12',
        time: '09:00 - 14:00',
        location: { th: 'ศาลาการเปรียญ', en: 'Main Hall' },
        description: { th: 'รายละเอียดกิจกรรม...' },
    },
    {
        id: 2,
        title: { th: 'ปฏิบัติธรรมประจำเดือน', en: 'Monthly Meditation Retreat' },
        date: '2025-03-01',
        time: '08:30 - 16:30',
        location: { th: 'อาคารวิปัสสนา', en: 'Meditation Center' },
        description: { th: 'รายละเอียดกิจกรรม...' },
    },
];

export default function EventsPage() {
    const t = useTranslations('EventsPage');
    const locale = useLocale();

    // Helper to get localized string from object
    const getLoc = (obj: any) => obj[locale as keyof typeof obj] || obj['th'];

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            {/* Header */}
            <div className="bg-primary text-white py-20">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">{t('title')}</h1>
                    <p className="text-xl font-light opacity-90">{t('subtitle')}</p>
                </div>
            </div>

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
                                <h2 className="text-2xl font-heading font-bold mb-3">{getLoc(event.title)}</h2>

                                <div className="space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Clock size={18} />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={18} />
                                        <span>{getLoc(event.location)}</span>
                                    </div>
                                </div>

                                <button className="px-6 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors">
                                    {t('readMore')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
