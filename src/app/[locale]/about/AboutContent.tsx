'use client';

import { useTranslations, useLocale } from 'next-intl';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import PageNavigation from '@/components/layout/PageNavigation';
import aboutData from '@/data/about.json';
import monksData from '@/data/monks.json';
import { getLocalizedText } from '@/utils/i18n';
import { Quote } from 'lucide-react';

export default function AboutContent() {
    const t = useTranslations('AboutPage');
    const locale = useLocale();

    // Filter monks for the Sangha section (excluding the Founder who is mentioned in history)
    const activeMonks = monksData.filter(m => m.id !== '1');

    const navItems = [
        { id: 'intro', label: getLocalizedText(aboutData.intro.navTitle, locale) },
        { id: 'objective', label: getLocalizedText(aboutData.objective.navTitle, locale) },
        { id: 'administration', label: getLocalizedText(aboutData.administration.navTitle, locale) },
        { id: 'history', label: getLocalizedText(aboutData.buddhaHistory.navTitle, locale) },
        { id: 'buildings', label: getLocalizedText(aboutData.buildings.title, locale) },
        { id: 'sangha', label: getLocalizedText(aboutData.sangha.navTitle, locale) },
    ];

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <PageContainer>
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">

                    {/* Sticky Navigation Sidebar */}
                    <div className="lg:w-64 shrink-0">
                        <div className="sticky top-24">
                            <PageNavigation items={navItems} />
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-24 min-w-0">

                        {/* Introduction */}
                        <section id="intro" className="scroll-mt-24">
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 transition-shadow hover:shadow-md">
                                <article className="prose prose-lg dark:prose-invert max-w-none">
                                    <h2 className="font-heading text-3xl font-bold text-primary mb-6">
                                        {getLocalizedText(aboutData.intro.title, locale)}
                                    </h2>
                                    <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                                        {getLocalizedText(aboutData.intro.description, locale)}
                                    </div>
                                    <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 border border-primary/10">
                                        <h3 className="text-lg font-bold text-primary mb-3">
                                            {getLocalizedText(aboutData.intro.founded, locale)}
                                        </h3>
                                        <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed">
                                            {getLocalizedText(aboutData.intro.location, locale)}
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>

                        {/* Founder's Intention (Quote Block) */}
                        <section id="objective" className="scroll-mt-24 relative">
                            <div className="absolute -left-6 -top-6 text-primary/10 z-0">
                                <Quote size={120} />
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border-l-[6px] border-primary p-8 md:p-12 relative z-10 hover:shadow-md transition-shadow">
                                <article className="prose prose-lg dark:prose-invert max-w-none">
                                    <h2 className="font-heading text-2xl font-bold text-primary mb-2">
                                        {getLocalizedText(aboutData.objective.title, locale)}
                                    </h2>
                                    <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-8 mt-0">
                                        {getLocalizedText(aboutData.objective.subtitle, locale)}
                                    </h3>
                                    <div className="whitespace-pre-wrap text-lg text-gray-700 dark:text-gray-200 leading-loose italic font-medium">
                                        {getLocalizedText(aboutData.objective.content, locale)}
                                    </div>
                                </article>
                            </div>
                        </section>

                        {/* Administration */}
                        <section id="administration" className="scroll-mt-24">
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 hover:shadow-md transition-shadow">
                                <article className="prose prose-lg dark:prose-invert max-w-none">
                                    <h2 className="font-heading text-2xl font-bold text-primary mb-6">
                                        {getLocalizedText(aboutData.administration.title, locale)}
                                    </h2>
                                    <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {getLocalizedText(aboutData.administration.content, locale)}
                                    </div>
                                </article>
                            </div>
                        </section>

                        {/* Buddha History */}
                        <section id="history" className="scroll-mt-24">
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 hover:shadow-md transition-shadow">
                                <article className="prose prose-lg dark:prose-invert max-w-none">
                                    <h2 className="font-heading text-2xl font-bold text-primary mb-6">
                                        {getLocalizedText(aboutData.buddhaHistory.title, locale)}
                                    </h2>
                                    <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {getLocalizedText(aboutData.buddhaHistory.content, locale)}
                                    </div>
                                </article>
                            </div>
                        </section>

                        {/* Buildings */}
                        <section id="buildings" className="scroll-mt-24">
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 hover:shadow-md transition-shadow">
                                <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-10">
                                    {getLocalizedText(aboutData.buildings.title, locale)}
                                </h2>
                                <div className="grid md:grid-cols-1 gap-10">
                                    {aboutData.buildings.items.map((building, index) => (
                                        <div key={index} className="flex gap-6 items-start group">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0 transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-heading font-bold text-xl text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">
                                                    {getLocalizedText(building.name, locale)}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                                                    {getLocalizedText(building.description, locale)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Sangha Mission */}
                        <section id="sangha" className="scroll-mt-24">
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 hover:shadow-md transition-shadow">
                                <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
                                    <h2 className="font-heading text-2xl font-bold text-primary mb-6">
                                        {getLocalizedText(aboutData.sangha.title, locale)}
                                    </h2>
                                    <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                        {getLocalizedText(aboutData.sangha.mission, locale)}
                                    </div>
                                    <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed pl-6 border-l-4 border-gray-200 dark:border-gray-700">
                                        {getLocalizedText(aboutData.sangha.currentWork, locale)}
                                    </div>
                                </article>

                                {/* Monks Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 not-prose mt-12 pt-12 border-t border-gray-100 dark:border-gray-800">
                                    {activeMonks.map((monk) => (
                                        <div key={monk.id} className="group bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-black/20 transition-all duration-300 hover:-translate-y-1">
                                            <div className="aspect-3/4 relative overflow-hidden">
                                                <img
                                                    src={monk.image}
                                                    alt={getLocalizedText(monk.name, locale)}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                                <div className="absolute bottom-0 left-0 p-5 text-white w-full">
                                                    <p className="text-xs font-bold tracking-wider uppercase text-primary-200 mb-1 opacity-90">
                                                        {getLocalizedText(monk.title, locale)}
                                                    </p>
                                                    <h3 className="text-base font-bold leading-tight">
                                                        {getLocalizedText(monk.name, locale)}
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
