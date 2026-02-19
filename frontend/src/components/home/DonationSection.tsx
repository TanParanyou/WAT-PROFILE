'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import contactData from '@/data/contact.json';
import { CreditCard, QrCode, Building2 } from 'lucide-react';

export default function DonationSection() {
    const t = useTranslations('DonationSection');
    const locale = useLocale();
    const [showQrModal, setShowQrModal] = useState(false);

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
                        <p className="text-gray-500 mb-6 text-sm">{t('createQrDesc')}</p>

                        {/* QR Code Placeholder/Generator */}
                        <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center h-64 mb-6 relative hover:border-primary transition-colors cursor-pointer group" onClick={() => setShowQrModal(true)}>
                            <div className="text-xs text-gray-400">{t('qrImage')}</div>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                <span className="text-xs font-semibold bg-white px-3 py-1 rounded-full shadow-sm">{t('clickToView')}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowQrModal(true)}
                                className="flex-1 bg-primary text-white py-2.5 rounded-lg active:scale-95 transition-all text-sm font-medium shadow-lg shadow-primary/20 hover:bg-primary/90"
                            >
                                {t('scanQr')}
                            </button>
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
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('bankLabel')}</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{contactData.bank.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('accountNameLabel')}</p>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{contactData.bank.account}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('ibanLabel')}</p>
                                    <p className="font-mono font-medium text-gray-900 dark:text-gray-100 break-all">{contactData.bank.iban}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('bicLabel')}</p>
                                    <p className="font-mono font-medium text-gray-900 dark:text-gray-100">{contactData.bank.bic}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* QR Modal */}
            {
                showQrModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowQrModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-zinc-900 p-6 rounded-2xl max-w-sm w-full relative"
                        >
                            <h3 className="text-xl font-bold mb-4 text-center">{t('scanQr')}</h3>
                            <div className="aspect-square bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center overflow-hidden mb-4">
                                {/* Replace with actual QR Code image */}
                                <div className="text-gray-400 text-sm">QR Code Image</div>
                            </div>
                            <p className="text-center text-sm text-gray-500 mb-6">{contactData.bank.name} - {contactData.bank.account}</p>
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="w-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white py-3 rounded-xl font-medium transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )
            }
        </section >
    );
}
