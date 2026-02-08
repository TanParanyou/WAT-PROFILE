'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import contactData from '@/data/contact.json';
import { CreditCard, QrCode, Building2 } from 'lucide-react';

export default function DonationSection() {
    const t = useTranslations('DonationSection');
    const locale = useLocale();

    return (
        <section className="py-20 bg-zinc-50 dark:bg-zinc-900">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-secondary font-sans font-medium tracking-wider mb-4 uppercase">
                            {t('subtitle')}
                        </h2>
                        <h1 className="text-3xl md:text-5xl font-heading font-bold text-primary mb-6 leading-relaxed">
                            {t('title')}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
                            {t('description')}
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Thai Bank / QR Code */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="bg-white dark:bg-zinc-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                            <QrCode size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-2">{t('scanQr')}</h3>
                        <p className="text-gray-500 mb-6 text-sm">Create a QR Code for instant transfer</p>

                        <div className="relative group cursor-pointer w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                            {/* Placeholder for QR Code */}
                            <div className="text-xs text-gray-400">QR Code Image</div>
                        </div>
                    </motion.div>

                    {/* German Bank Account */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        viewport={{ once: true }}
                        className="bg-white dark:bg-zinc-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center"
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
                            <Building2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{t('bankTransfer')}</h3>

                        <div className="w-full space-y-4 text-left bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-2xl">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Bank</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{contactData.bank.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Account Name</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{contactData.bank.account}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">IBAN</p>
                                <p className="font-mono font-medium text-gray-900 dark:text-gray-100 break-all">{contactData.bank.iban}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">BIC</p>
                                <p className="font-mono font-medium text-gray-900 dark:text-gray-100">{contactData.bank.bic}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
