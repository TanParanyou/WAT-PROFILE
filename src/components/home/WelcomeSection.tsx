'use client';

import { siteConfig } from '@/config/site.config';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function WelcomeSection() {
    const t = useTranslations('WelcomeSection');
    const tSite = useTranslations('Site');

    return (
        <section className="py-20 bg-white dark:bg-zinc-950">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-secondary font-sans font-medium tracking-wider mb-4 uppercase">
                            {t('welcome')}
                        </h2>
                        <h1 className="text-3xl md:text-5xl font-heading font-bold text-primary mb-8 leading-relaxed">
                            {tSite('name')}
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="prose prose-lg dark:prose-invert mx-auto text-gray-600 dark:text-gray-400 leading-relaxed font-light"
                    >
                        <p className="mb-6">
                            {t('description')}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {/* Feature 1 */}
                        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4 text-2xl">
                                🙏
                            </div>
                            <h3 className="font-heading font-bold text-lg mb-2">{t('meditation')}</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                {t('meditationDesc')}
                            </p>
                        </div>
                        {/* Feature 2 */}
                        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4 text-2xl">
                                🏫
                            </div>
                            <h3 className="font-heading font-bold text-lg mb-2">{t('sundaySchool')}</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                {t('sundaySchoolDesc')}
                            </p>
                        </div>
                        {/* Feature 3 */}
                        <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4 text-2xl">
                                🌺
                            </div>
                            <h3 className="font-heading font-bold text-lg mb-2">{t('culture')}</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                {t('cultureDesc')}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
