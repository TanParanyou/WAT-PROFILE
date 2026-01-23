'use client';

import { useTranslations } from 'next-intl';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';

export default function AboutPage() {
    const t = useTranslations('AboutPage');

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <PageContainer>
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-8 md:p-16">
                    <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-10 w-2 bg-primary rounded-full"></div>
                            <h2 className="font-heading text-3xl font-bold text-gray-900 dark:text-white m-0">{t('historyTitle')}</h2>
                        </div>

                        <p className="lead text-gray-600 dark:text-gray-300">
                            วัดเสริมรังษี ก่อตั้งขึ้นเมื่อ... (รอข้อมูลจากผู้ใช้งาน) โดยมีวัตถุประสงค์เพื่อเป็นศูนย์รวมจิตใจ
                            ของพุทธศาสนิกชนในพื้นที่ กรุงวอชิงตัน ดี.ซี. และรัฐใกล้เคียง
                        </p>

                        <hr className="my-12 border-gray-100 dark:border-gray-700" />

                        <div className="grid md:grid-cols-2 gap-12 not-prose">
                            <div>
                                <h2 className="font-heading text-2xl font-bold text-primary mb-6 flex items-center gap-3">
                                    {t('visionTitle')}
                                </h2>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl">
                                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">1</span>
                                        <span className="text-gray-700 dark:text-gray-300">{t('vision1')}</span>
                                    </li>
                                    <li className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl">
                                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">2</span>
                                        <span className="text-gray-700 dark:text-gray-300">{t('vision2')}</span>
                                    </li>
                                    <li className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl">
                                        <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">3</span>
                                        <span className="text-gray-700 dark:text-gray-300">{t('vision3')}</span>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h2 className="font-heading text-2xl font-bold text-primary mb-6 flex items-center gap-3">
                                    {t('missionTitle')}
                                </h2>
                                <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/10">
                                    <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                                        &quot;{t('missionDesc')}&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
