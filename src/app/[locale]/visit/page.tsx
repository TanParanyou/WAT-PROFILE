'use client';

import { siteConfig } from '@/config/site.config';
import { Clock, MapPin, Car, Info, HandHeart } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function VisitPage() {
    const t = useTranslations('VisitPage');

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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Information Column */}
                    <div className="space-y-12">
                        {/* Opening Hours */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="text-primary" size={28} />
                                <h2 className="text-2xl font-heading font-bold">{t('openingHours')}</h2>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <p className="text-lg">Mon - Sun: 08:00 - 18:00</p>
                                {/* Add specific timings if needed */}
                            </div>
                        </section>

                        {/* Directions */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <Car className="text-primary" size={28} />
                                <h2 className="text-2xl font-heading font-bold">{t('directions')}</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <h3 className="font-bold mb-2">{t('car')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Use GPS navigation to Wat Serm Rangsi. Parking is available on-site.
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <h3 className="font-bold mb-2">{t('publicTransport')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Take bus line X to station Y... (Replace with real info)
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Etiquette & Map */}
                    <div className="space-y-12">
                        {/* Etiquette */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <Info className="text-primary" size={28} />
                                <h2 className="text-2xl font-heading font-bold">{t('etiquette')}</h2>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                <ul className="space-y-4">
                                    <li className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
                                        <div>
                                            <h4 className="font-bold">{t('dressCode')}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('dressCodeDesc')}</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
                                        <div>
                                            <h4 className="font-bold">{t('behavior')}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('behaviorDesc')}</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Map */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <MapPin className="text-primary" size={28} />
                                <h2 className="text-2xl font-heading font-bold">{t('map')}</h2>
                            </div>
                            <div className="h-64 sm:h-80 w-full bg-gray-200 dark:bg-zinc-800 rounded-2xl overflow-hidden relative">
                                {/* Replace with actual Google Maps Embed Iframe */}
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                    Map Embed Placeholder
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
