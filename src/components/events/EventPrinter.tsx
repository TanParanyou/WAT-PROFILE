'use client';

import { useRef, Fragment } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Event, LocalizedText } from '@/types/common';
import { getLocalizedText } from '@/utils/i18n';

interface EventPrinterProps {
    event: Event;
    locale: string;
}

export default function EventPrinter({ event, locale }: EventPrinterProps) {
    const t = useTranslations('EventPrinter');
    const contentRef = useRef<HTMLDivElement>(null);
    const reactToPrintFn = useReactToPrint({ contentRef });

    return (
        <>
            <button
                onClick={() => reactToPrintFn()}
                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-all font-medium active:scale-95 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-lg"
            >
                <Printer size={20} />
                <span>{t('printButton')}</span>
            </button>

            {/* Hidden Print Content */}
            <div className="hidden">
                <div ref={contentRef} className="print-content p-8 max-w-[210mm] mx-auto bg-white text-black min-h-screen">
                    {/* Header */}
                    <div className="text-center border-b-2 border-black pb-6 mb-8">
                        <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">{t('title')}</h1>
                        <p className="text-sm text-gray-600 uppercase tracking-wide">{t('subtitle')}</p>
                    </div>

                    {/* Event Title & Info */}
                    <div className="mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{getLocalizedText(event.title, locale)}</h2>
                                <p className="text-gray-600 italic">{getLocalizedText(event.location, locale)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg">{event.date}</p>
                                <p className="text-gray-600">{event.time}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg mb-8 text-sm leading-relaxed text-gray-800 text-justify">
                            {getLocalizedText(event.description, locale)}
                        </div>
                    </div>

                    {/* Schedule Table */}
                    {event.schedule && event.schedule.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-bold uppercase border-b border-black mb-4 pb-2">{t('scheduleTitle')}</h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-black">
                                        <th className="py-2 text-left w-24">{t('time')}</th>
                                        <th className="py-2 text-left">{t('activity')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {event.schedule.map((item, idx) => {
                                        const currentDay = item.day ? getLocalizedText(item.day, locale) : null;
                                        const previousDay = idx > 0 && event.schedule[idx - 1].day ? getLocalizedText(event.schedule[idx - 1].day!, locale) : null;
                                        const showDayHeader = currentDay && currentDay !== previousDay;

                                        return (
                                            <Fragment key={idx}>
                                                {showDayHeader && (
                                                    <tr className="bg-gray-100 print:bg-gray-100">
                                                        <td colSpan={2} className="py-2 px-2 font-bold border-b border-gray-300">
                                                            {currentDay}
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr className="border-b border-gray-100">
                                                    <td className="py-3 px-2 font-mono align-top">{item.time}</td>
                                                    <td className="py-3 px-2">{getLocalizedText(item.activity, locale)}</td>
                                                </tr>
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
                        <p>{t('footerTitle')}</p>
                        <p>{t('printedOn')} {new Date().toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}</p>
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body {
                        background: white;
                    }
                    .print-content {
                        display: block !important;
                    }
                }
            `}</style>
        </>
    );
}


