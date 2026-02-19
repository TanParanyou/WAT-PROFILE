'use client';

import { siteConfig } from '@/config/site.config';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function HeroSection() {
    const t = useTranslations('HeroSection');
    const tSite = useTranslations('Site');

    return (
        <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Background Image (Placeholder) */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url(/images/hero-bg.png)',
                }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 z-10" />
            </div>

            {/* Content */}
            <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-xl md:text-2xl text-white font-medium tracking-wider mb-4 font-sans">
                        {t('welcomeTo')}
                    </h2>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold text-white mb-6 leading-tight">
                        {tSite('name')}
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
                        {tSite('name')}
                        <br className="hidden md:block" />
                        {t('inLocation')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/events"
                            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-medium transition-all flex items-center gap-2"
                        >
                            {t('viewEvents')} <ArrowRight size={18} />
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
                    <div className="w-1 h-2 bg-white/50 rounded-full" />
                </div>
            </motion.div>

            {/* Fallback bg color if image fails */}
            <div className="absolute inset-0 -z-10 bg-zinc-900" />
        </section>
    );
}
