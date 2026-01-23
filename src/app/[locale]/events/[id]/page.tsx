
import { Calendar, Clock, MapPin, ArrowLeft, CalendarPlus, Navigation } from 'lucide-react';
import { Link } from '@/navigation';
import events from '@/data/events.json';
import { getLocalizedText } from '@/utils/i18n';
import { Event } from '@/types/common';

// Define Props for Server Component in Next.js 15
interface Props {
    params: Promise<{ id: string; locale: string }>;
}

import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';

export default async function EventDetailPage({ params }: Props) {
    const { id, locale } = await params;
    const eventId = Number(id);
    const event = events.find(e => e.id === eventId) as Event | undefined;

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Event Not Found (ID: {id})</h1>
                <Link href="/events" className="text-primary hover:underline">
                    Back to Events
                </Link>
            </div>
        );
    }

    const getGoogleCalendarUrl = (e: Event) => {
        const title = encodeURIComponent(getLocalizedText(e.title, 'en'));
        const details = encodeURIComponent(getLocalizedText(e.description, 'en'));
        const location = encodeURIComponent(getLocalizedText(e.location, 'en'));

        // Simple mock dates for demo (real implementation would parse e.date/time)
        const startDate = e.date.replace(/-/g, '') + 'T090000';
        const endDate = e.date.replace(/-/g, '') + 'T170000';

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`;
    };

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20">
            <PageHeader
                title={getLocalizedText(event.title, locale)}
            >
                <div className="flex flex-wrap items-center justify-center gap-4 text-white opacity-90 text-sm md:text-base">
                    <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <Calendar size={18} /> {event.date}
                    </span>
                    <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <MapPin size={18} /> {getLocalizedText(event.location, locale)}
                    </span>
                </div>
            </PageHeader>

            <PageContainer>
                <Link
                    href="/events"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-8 transition-colors font-medium group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Events
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Left Column) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image & Description */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="aspect-video bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-400 relative">
                                <span className="text-lg font-medium">[Image: {event.image}]</span>
                            </div>

                            <div className="p-8 md:p-10">
                                <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-3 text-primary">
                                    About this Event
                                </h2>
                                <p className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300 text-lg">
                                    {getLocalizedText(event.description, locale)}
                                </p>
                            </div>
                        </div>

                        {/* Schedule Table */}
                        {event.schedule && event.schedule.length > 0 && (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10">
                                <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-3 text-primary">
                                    <Clock className="stroke-[2.5px]" /> Event Schedule
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                                                <th className="py-4 px-4 font-semibold w-1/4">Time</th>
                                                <th className="py-4 px-4 font-semibold">Activity</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {event.schedule.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <td className="py-4 px-4 font-bold text-primary font-mono whitespace-nowrap align-top">
                                                        {item.time}
                                                    </td>
                                                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                                                        {getLocalizedText(item.activity, locale)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Right Column) */}
                    <div className="space-y-8 sticky top-24 self-start h-fit">
                        {/* Event Info Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h3 className="text-xl font-bold mb-6 font-heading">Event Details</h3>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Date</p>
                                        <p className="font-medium">{event.date}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Time</p>
                                        <p className="font-medium">{event.time}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Location</p>
                                        <p className="font-medium">{getLocalizedText(event.location, locale)}</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-6 border-gray-100 dark:border-gray-800" />

                            <a
                                href={getGoogleCalendarUrl(event)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 active:scale-95"
                            >
                                <CalendarPlus size={20} />
                                Save to Calendar
                            </a>
                        </div>

                        {/* Map Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Navigation size={18} className="text-primary" />
                                    Location
                                </h3>
                            </div>
                            <div className="h-64 bg-gray-100 dark:bg-zinc-800 relative">
                                {event.mapUrl ? (
                                    <iframe
                                        src={event.mapUrl}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="grayscale hover:grayscale-0 transition-all duration-500"
                                    ></iframe>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        No map available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
