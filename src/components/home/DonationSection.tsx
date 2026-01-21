'use client';

import { motion } from 'framer-motion';
import { CreditCard, Heart, QrCode } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function DonationSection() {
    const t = useTranslations('DonationSection');

    return (
        <section className="py-20 bg-primary text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('/images/thai-pattern.png')] opcode-10 pointer-events-none" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                    {/* Left: Text Content */}
                    <motion.div
                        className="lg:w-1/2"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
                            {t('title')}
                        </h2>
                        <h3 className="text-xl md:text-2xl font-light opacity-90 mb-8 font-sans">
                            {t('subtitle')}
                        </h3>
                        <p className="text-lg opacity-80 mb-8 leading-relaxed max-w-xl">
                            {t('description')}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/donate"
                                className="px-8 py-4 bg-white text-primary hover:bg-gray-100 rounded-full font-bold transition-colors inline-flex items-center gap-2"
                            >
                                <Heart size={20} fill="currentColor" />
                                {t('donateOnline')}
                            </Link>
                            <Link
                                href="/contact"
                                className="px-8 py-4 bg-transparent border border-white/30 text-white hover:bg-white/10 rounded-full font-medium transition-colors"
                            >
                                {t('contactUs')}
                            </Link>
                        </div>
                    </motion.div>

                    {/* Right: Donation Options/QR */}
                    <motion.div
                        className="lg:w-5/12 w-full"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                <h4 className="font-heading font-bold text-xl">{t('channels')}</h4>
                                <CreditCard size={24} className="opacity-80" />
                            </div>

                            <div className="space-y-6">
                                {/* Option 1: Zelle */}
                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white shrink-0">
                                        Z
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-lg">Zelle</h5>
                                        <p className="text-sm opacity-80">{t('zelleDesc')}</p>
                                        <p className="text-yellow-300 font-mono mt-1">donate@watsermrangsi.org</p>
                                    </div>
                                </div>

                                {/* Option 2: QR Code (Thai) */}
                                <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                                        <QrCode size={24} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-lg">Thai QR Payment</h5>
                                        <p className="text-sm opacity-80">{t('scanQr')}</p>
                                        <p className="text-yellow-300 text-sm mt-1">{t('clickToView')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
