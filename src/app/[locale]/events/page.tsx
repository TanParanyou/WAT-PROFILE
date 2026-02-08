'use client';

import { useTranslations, useLocale, useFormatter } from 'next-intl';
import { Clock, MapPin, Calendar, Video } from 'lucide-react';
import events from '@/data/events.json';
import scheduleData from '@/data/schedule.json';
import { Link } from '@/navigation';
import { getLocalizedText } from '@/utils/i18n';

import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
// Import ArrowRight as it wasn't there before
import { ArrowRight } from 'lucide-react';

export default function EventsPage() {
    const t = useTranslations('EventsPage');
    const locale = useLocale();
    const format = useFormatter();

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <PageContainer>
                {/* Regular Schedule Section */}
                <div className="max-w-5xl mx-auto mb-16">
                    <h2 className="text-2xl font-heading font-bold mb-8 text-center text-primary">{t('regularSchedule') || (locale === 'th' ? 'ตารางกิจวัตรประจำวัน' : 'Daily Schedule')}</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Daily */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-md border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    <Clock size={24} />
                                </div>
                                <h3 className="text-xl font-bold">{locale === 'th' ? 'ประจำวัน' : 'Daily'}</h3>
                            </div>
                            {/* Mobile View (List) */}
                            <div className="md:hidden space-y-6">
                                {scheduleData.daily.map((item, index) => (
                                    <div key={index} className="flex flex-col gap-1 border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                                        <div className="font-mono font-bold text-primary">{item.time}</div>
                                        <div className="text-gray-700 dark:text-gray-300">
                                            {getLocalizedText(item.activity, locale)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View (Table) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700">
                                            <th className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">{t('time')}</th>
                                            <th className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">{t('activity')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y dark:divide-gray-800">
                                        {scheduleData.daily.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="py-3 px-4 font-mono font-bold text-gray-500 whitespace-nowrap align-top">{item.time}</td>
                                                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                                    {getLocalizedText(item.activity, locale)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Weekly & Online */}
                        <div className="space-y-8">
                            {/* Weekly */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-md border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-green-500/10 rounded-xl text-green-600">
                                        <Calendar size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold">{locale === 'th' ? 'ประจำสัปดาห์' : 'Weekly'}</h3>
                                </div>
                                {/* Mobile View (List) */}
                                <div className="md:hidden space-y-6">
                                    {scheduleData.weekly.map((item, index) => (
                                        <div key={index} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                                            <div className="font-bold text-gray-900 dark:text-white mb-2">
                                                {getLocalizedText(item.day, locale)}
                                            </div>
                                            <div className="flex flex-col gap-1 pl-4 border-l-2 border-primary/20">
                                                <div className="font-mono font-bold text-gray-500 text-sm">{item.time}</div>
                                                <div className="text-gray-700 dark:text-gray-300">
                                                    {getLocalizedText(item.activity, locale)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View (Table) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b dark:border-gray-700">
                                                <th className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">{t('day')}</th>
                                                <th className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">{t('time')}</th>
                                                <th className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">{t('activity')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y dark:divide-gray-800">
                                            {scheduleData.weekly.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-gray-900 dark:text-white align-top whitespace-nowrap">
                                                        {getLocalizedText(item.day, locale)}
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-bold text-gray-500 whitespace-nowrap align-top">{item.time}</td>
                                                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                                                        {getLocalizedText(item.activity, locale)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Online */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-8 shadow-sm border border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                                        <Video size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold">{getLocalizedText(scheduleData.online.title, locale)}</h3>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {getLocalizedText(scheduleData.online.description, locale)}
                                </p>
                                <a
                                    href={scheduleData.online.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
                                >
                                    Join via Facebook <ArrowRight size={16} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-heading font-bold mb-8 text-primary max-w-5xl mx-auto">{t('upcomingEvents') || (locale === 'th' ? 'ปฏิทินกิจกรรม 2569' : 'Events Calendar 2026')}</h2>
                <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
                    {events
                        .filter(e => e.active)
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((event) => (
                            <div key={event.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800 relative group overflow-hidden">
                                {/* Decorative accent */}
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors"></div>

                                {/* Image & Date */}
                                <div className="shrink-0 relative md:w-72 h-48 md:h-auto bg-gray-200 dark:bg-zinc-800">
                                    <img
                                        src={event.image}
                                        alt={getLocalizedText(event.title, locale)}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-white dark:bg-zinc-900/90 backdrop-blur-sm p-3 rounded-xl text-center shadow-lg border border-gray-100 dark:border-gray-700">
                                        <span className="block text-2xl font-bold font-heading text-primary leading-none">{format.dateTime(new Date(event.date), { day: 'numeric' })}</span>
                                        <span className="block text-xs uppercase font-bold opacity-70 mt-1">{format.dateTime(new Date(event.date), { month: 'short' })}</span>
                                    </div>
                                </div>

                                <div className="grow">
                                    <h2 className="text-2xl font-heading font-bold mb-2 group-hover:text-primary transition-colors">
                                        {getLocalizedText(event.title, locale)}
                                    </h2>

                                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                                        {getLocalizedText(event.description, locale)}
                                    </p>

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
