import { Calendar, Clock, MapPin, ArrowLeft, CalendarPlus, Navigation, Share2 } from 'lucide-react';
import { Fragment } from 'react';
import { Link } from '@/navigation';
import events from '@/data/events.json';
import { getLocalizedText } from '@/utils/i18n';
import { Event } from '@/types/common';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { getTranslations, getFormatter } from 'next-intl/server';

// Define Props for Server Component in Next.js 15
interface Props {
    params: Promise<{ id: string; locale: string }>;
}


import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import ShareButton from '@/components/common/ShareButton';
import PageBreadcrumbs from '@/components/common/PageBreadcrumbs';
import EventPrinter from '@/components/events/EventPrinter';

export async function generateStaticParams() {
    return events.flatMap((event) => [
        { id: event.id.toString(), locale: 'en' },
        { id: event.id.toString(), locale: 'th' },
    ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id, locale } = await params;
    const eventId = Number(id);
    const event = events.find((e) => e.id === eventId);

    if (!event) {
        return {
            title: 'Event Not Found',
        };
    }

    const title = getLocalizedText(event.title, locale);
    const description = getLocalizedText(event.description, locale);

    return {
        title: `${title} - Wat Serm Rangsi`,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [event.image],
            type: 'article',
        },
    };
}

export default async function EventDetailPage({ params }: Props) {
    const { id, locale } = await params;
    const eventId = Number(id);
    const event = events.find(e => e.id === eventId) as Event | undefined;
    const t = await getTranslations('EventDetailPage');
    const tEvents = await getTranslations('EventsSection');
    const format = await getFormatter();

    if (!event) {
        notFound();
    }

    // Related Events Logic
    const relatedEvents = events
        .filter(e => e.id !== event.id)
        .slice(0, 3);

    const getGoogleCalendarUrl = (e: Event) => {
        const title = encodeURIComponent(getLocalizedText(e.title, 'en'));
        const details = encodeURIComponent(getLocalizedText(e.description, 'en'));
        const location = encodeURIComponent(getLocalizedText(e.location, 'en'));

        // Simple mock dates for demo (real implementation would parse e.date/time)
        const startDate = e.date.replace(/-/g, '') + 'T090000';
        const endDate = e.date.replace(/-/g, '') + 'T170000';

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startDate}/${endDate}`;
    };

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: getLocalizedText(event.title, locale),
        startDate: event.date, // Note: In production, ISO format with time is better
        endDate: event.date,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: getLocalizedText(event.location, locale),
            address: {
                '@type': 'PostalAddress',
                streetAddress: 'Wat Serm Rangsi',
                addressLocality: 'Bangkok',
                addressCountry: 'TH'
            }
        },
        image: [event.image],
        description: getLocalizedText(event.description, locale),
    };

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20">
            <Script
                id="event-json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <PageHeader
                title={getLocalizedText(event.title, locale)}
            >
                <div className="flex flex-wrap items-center justify-center gap-4 text-white opacity-90 text-sm md:text-base">
                    <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <Calendar size={18} /> {format.dateTime(new Date(event.date), { dateStyle: 'long' })}
                    </span>
                    <span className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <MapPin size={18} /> {getLocalizedText(event.location, locale)}
                    </span>
                </div>
            </PageHeader>

            <PageContainer>
                {/* Navigation & Actions Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-lg shadow-black/5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Breadcrumbs & Back */}
                    <div className="flex flex-col gap-2">
                        <div className="">
                            <PageBreadcrumbs
                                items={[
                                    { label: t('breadcrumbs.events'), href: '/events' },
                                    { label: getLocalizedText(event.title, locale), active: true }
                                ]}
                            />
                        </div>
                        <Link
                            href="/events"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium group w-fit"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Events
                        </Link>
                    </div>

                    {/* Share Button & Print */}
                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-800 pt-4 md:pt-0 md:pl-6">
                        <EventPrinter event={event} locale={locale} />
                        <ShareButton />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Left Column) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image & Description */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="aspect-video bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-400 relative">
                                <img
                                    src={event.image}
                                    alt={getLocalizedText(event.title, locale)}
                                    className="w-full h-full object-cover"
                                />
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
                                            {event.schedule.map((item, idx) => {
                                                const currentDay = item.day ? getLocalizedText(item.day, locale) : null;
                                                const previousDay = idx > 0 && event.schedule[idx - 1].day ? getLocalizedText(event.schedule[idx - 1].day!, locale) : null;
                                                const showDayHeader = currentDay && currentDay !== previousDay;

                                                return (
                                                    <Fragment key={idx}>
                                                        {showDayHeader && (
                                                            <tr className="bg-zinc-50/80 dark:bg-zinc-800/50">
                                                                <td colSpan={2} className="py-3 px-4 font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider pl-4 border-l-4 border-primary/50">
                                                                    {currentDay}
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                            <td className="py-4 px-4 font-bold text-primary font-mono whitespace-nowrap align-top w-32">
                                                                {item.time}
                                                            </td>
                                                            <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                                                                {getLocalizedText(item.activity, locale)}
                                                            </td>
                                                        </tr>
                                                    </Fragment>
                                                );
                                            })}
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
                                        <p className="font-medium">{format.dateTime(new Date(event.date), { dateStyle: 'long' })}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center shrink-0">
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

                {/* Related Events Section */}
                <div className="mt-20 border-t border-gray-200 dark:border-gray-800 pt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
                            {t('relatedEvents')}
                        </h2>
                        <Link href="/events" className="text-primary font-medium hover:underline">
                            {tEvents('viewAll')}
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {relatedEvents.map((relatedEvent, index) => (
                            <Link
                                href={`/events/${relatedEvent.id}`}
                                key={relatedEvent.id}
                                className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group block border border-gray-100 dark:border-gray-700"
                            >
                                <div className="h-40 bg-gray-200 dark:bg-zinc-700 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500">
                                        <img
                                            src={relatedEvent.image}
                                            alt={getLocalizedText(relatedEvent.title, locale)}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute top-3 right-3 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                                        {format.dateTime(new Date(relatedEvent.date), { dateStyle: 'medium' })}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-heading font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">
                                        {getLocalizedText(relatedEvent.title, locale)}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        <Clock size={14} />
                                        <span>{relatedEvent.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <MapPin size={14} />
                                        <span>{getLocalizedText(relatedEvent.location, locale)}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
