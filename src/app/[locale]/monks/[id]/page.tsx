import { Link } from '@/navigation';
import monks from '@/data/monks.json';
import { notFound } from 'next/navigation';
import { getLocalizedText } from '@/utils/i18n';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import DetailNavigation from '@/components/common/DetailNavigation';
import { User, Quote } from 'lucide-react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

interface Props {
    params: Promise<{
        id: string;
        locale: string;
    }>
}

export async function generateStaticParams() {
    return monks.flatMap((monk) => [
        { id: monk.id, locale: 'en' },
        { id: monk.id, locale: 'th' },
    ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id, locale } = await params;
    const monk = monks.find((m) => m.id === id);

    if (!monk) {
        return {
            title: 'Monk Not Found',
        };
    }

    const name = getLocalizedText(monk.name, locale);
    const title = getLocalizedText(monk.title, locale);

    return {
        title: `${name} - Wat Serm Rangsi`,
        description: `Biography of ${name}, ${title}`,
        openGraph: {
            title: name,
            description: `Biography of ${name}, ${title}`,
            images: [monk.image],
        },
    };
}

export default async function MonkDetailPage({ params }: Props) {
    const { id, locale } = await params;
    const t = await getTranslations('MonksPage');

    const monk = monks.find(m => m.id === id);

    if (!monk) {
        notFound();
    }

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen pb-20">
            <PageHeader
                title={getLocalizedText(monk.name, locale)}
                subtitle={getLocalizedText(monk.title, locale)}
            />

            <PageContainer>
                {/* Navigation & Actions Card */}
                <DetailNavigation
                    breadcrumbs={[
                        { label: t('title'), href: '/monks' },
                        { label: getLocalizedText(monk.name, locale), active: true }
                    ]}
                    backHref="/monks"
                    backLabel={t('backButton')}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Left Column: Image & Quick Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-xl shadow-primary/5 border-4 border-white dark:border-zinc-800 sticky top-24">
                            <div className="aspect-[3/4] relative bg-zinc-100 dark:bg-zinc-800">
                                <img
                                    src={monk.image}
                                    alt={getLocalizedText(monk.name, locale)}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-24 text-white">
                                    <span className="inline-block px-3 py-1 bg-primary text-white text-xs font-bold rounded-full mb-2">
                                        {getLocalizedText(monk.title, locale)}
                                    </span>
                                    <h2 className="text-xl font-bold font-heading">
                                        {getLocalizedText(monk.name, locale)}
                                    </h2>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Role</p>
                                        <p className="font-medium">{getLocalizedText(monk.title, locale)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="lg:col-span-8">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-800">
                            <div className="mb-8">
                                <Quote className="text-primary/20 w-16 h-16 mb-4" />
                                <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-6">
                                    Biography
                                </h2>
                                <div className="w-20 h-1.5 bg-primary rounded-full"></div>
                            </div>

                            <div
                                className="prose prose-lg dark:prose-invert max-w-none 
                                    prose-headings:font-heading prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                                    prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                    prose-strong:text-gray-900 dark:prose-strong:text-white
                                    prose-img:rounded-2xl prose-img:shadow-md"
                                dangerouslySetInnerHTML={{ __html: getLocalizedText(monk.content, locale) }}
                            />
                        </div>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
