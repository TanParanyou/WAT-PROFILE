import { useTranslations, useLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import aboutData from '@/data/about.json';
import { getLocalizedText } from '@/utils/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'AboutPage' });

    return {
        title: t('title'),
        description: t('missionDesc'),
    };
}

export default function AboutPage() {
    const t = useTranslations('AboutPage');
    const locale = useLocale();

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <PageContainer>
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Introduction */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-12">
                        <section className="prose prose-lg dark:prose-invert max-w-none">
                            <h2 className="font-heading text-3xl font-bold text-primary mb-6">
                                {getLocalizedText(aboutData.intro.title, locale)}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {getLocalizedText(aboutData.intro.description, locale)}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                {getLocalizedText(aboutData.intro.founded, locale)}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {getLocalizedText(aboutData.intro.location, locale)}
                            </p>
                        </section>
                    </div>

                    {/* Objective */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-12">
                        <section className="prose prose-lg dark:prose-invert max-w-none">
                            <h2 className="font-heading text-2xl font-bold text-primary mb-6">
                                {getLocalizedText(aboutData.objective.title, locale)}
                            </h2>
                            <div className="whitespace-pre-wrap text-gray-600 dark:text-gray-300 leading-relaxed italic border-l-4 border-primary/20 pl-6">
                                {getLocalizedText(aboutData.objective.content, locale)}
                            </div>
                        </section>
                    </div>

                    {/* Administration */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-12">
                        <section className="prose prose-lg dark:prose-invert max-w-none">
                            <h2 className="font-heading text-2xl font-bold text-primary mb-6">
                                {getLocalizedText(aboutData.administration.title, locale)}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {getLocalizedText(aboutData.administration.content, locale)}
                            </p>
                        </section>
                    </div>

                    {/* Buddha History */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-12">
                        <section className="prose prose-lg dark:prose-invert max-w-none">
                            <h2 className="font-heading text-2xl font-bold text-primary mb-6">
                                {getLocalizedText(aboutData.buddhaHistory.title, locale)}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                {getLocalizedText(aboutData.buddhaHistory.content, locale)}
                            </p>
                        </section>
                    </div>

                    {/* Buildings */}
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-12">
                        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-8">
                            {locale === 'th' ? 'อาคารภายในวัด' : locale === 'en' ? 'Buildings' : 'Gebäude'}
                        </h2>
                        <div className="grid md:grid-cols-1 gap-8">
                            {aboutData.buildings.map((building, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize mb-2">
                                            {getLocalizedText(building.name, locale)}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {getLocalizedText(building.description, locale)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </PageContainer>
        </div>
    );
}
