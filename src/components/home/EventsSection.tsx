'use client';

import { Calendar, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

// Mock data - normally this would come from an API or CMS
// NOTE: For static structure with dynamic content, we'd typically fetch data or use keys.
// Here I'll mock using translation keys if possible or just simpler content.
// Since these are specific "dynamic" events, in a real app they wouldn't be in messages.json usually.
// But for this demo, I will keep the structure but use the `t` function if the text was meant to be static, 
// OR I will assume the data passes localized strings.
// However, `next-intl` expects `t('key')`. If I have data objects with {th: '...', en: '...'}, I need to select one based on locale.
// But useTranslations doesn't expose locale directly unless used.
// Easy fix: use `useLocale()` hook.

import { useLocale } from 'next-intl';

const events = [
    {
        id: 1,
        title: { th: 'พิธีทำบุญตักบาตรวันมาฆบูชา', en: 'Makha Bucha Day Ceremony' },
        date: '2025-02-12',
        time: '09:00 - 14:00',
        location: { th: 'ศาลาการเปรียญ', en: 'Main Hall' },
        image: '/images/event-makha.jpg', // Placeholder
        description: {
            th: 'ขอเชิญพุทธศาสนิกชนร่วมทำบุญตักบาตร ฟังพระธรรมเทศนา และเวียนเทียน เนื่องในวันมาฆบูชา',
            en: 'Join us for merit-making, listening to Dhamma talks, and candlelight procession on Makha Bucha Day.',
        },
    },
    {
        id: 2,
        title: { th: 'ปฏิบัติธรรมประจำเดือน', en: 'Monthly Meditation Retreat' },
        date: '2025-03-01',
        time: '08:30 - 16:30',
        location: { th: 'อาคารวิปัสสนา', en: 'Meditation Center' },
        image: '/images/event-meditation.jpg', // Placeholder
        description: {
            th: 'โครงการอบรมวิปัสสนากรรมฐานเบื้องต้น สำหรับบุคคลทั่วไป ไม่มีค่าใช้จ่าย',
            en: 'Introductory Vipassana meditation workshop for beginners. Free of charge.',
        },
    },
    {
        id: 3,
        title: { th: 'งานเทศกาลสงกรานต์', en: 'Songkran Festival' },
        date: '2025-04-13',
        time: '10:00 - 17:00',
        location: { th: 'ลานวัด', en: 'Temple Grounds' },
        image: '/images/event-songkran.jpg', // Placeholder
        description: {
            th: 'สืบสานประเพณีไทย สรงน้ำพระ รดน้ำดำหัวผู้สูงอายุ และการแสดงทางวัฒนธรรม',
            en: 'Celebrate Thai New Year with Buddha bathing ceremony, paying respect to elders, and cultural performances.',
        },
    },
];

export default function EventsSection() {
    const t = useTranslations('EventsSection');
    const locale = useLocale();

    // Helper to get localized string from object
    const getLoc = (obj: any) => obj[locale as keyof typeof obj] || obj['th'];

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
                                    {getLoc(event.title)}
                                </h3>

                                <div className="space-y-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-primary/70 shrink-0" />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-primary/70 shrink-0" />
                                        <span>{getLoc(event.location)}</span>
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 grow">
                                    {getLoc(event.description)}
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
