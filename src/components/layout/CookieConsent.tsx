'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { X } from 'lucide-react';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const t = useTranslations('CookieConsent');

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Show with a slight delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="fixed bottom-0 left-0 right-0 z-100 px-4 pb-4 md:pb-6 pointer-events-none"
                >
                    <div className="container mx-auto max-w-5xl pointer-events-auto">
                        <div className="bg-zinc-950/95 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 md:flex md:items-center md:justify-between gap-8 shadow-2xl ring-1 ring-black/5">
                            <div className="space-y-3 md:max-w-xl">
                                <h3 className="text-xl font-heading font-bold text-white">
                                    {t('title')}
                                </h3>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                    {t('description')}{' '}
                                    <Link
                                        href="/privacy"
                                        className="text-primary hover:text-primary/80 transition-colors underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
                                    >
                                        {t('readMore')}
                                    </Link>
                                </p>
                            </div>

                            <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 min-w-fit">
                                <button
                                    onClick={handleDecline}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:bg-white/5 transition-colors uppercase tracking-wider"
                                >
                                    {t('decline')}
                                </button>
                                <button
                                    onClick={handleAccept}
                                    className="px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10 uppercase tracking-wider"
                                >
                                    {t('acceptAll')}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
