'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import galleryData from '@/data/gallery.json';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function GalleryPage() {
    const t = useTranslations('GalleryPage');
    const locale = useLocale();
    const [filter, setFilter] = useState('all');
    const [index, setIndex] = useState(-1);

    const filteredImages = filter === 'all'
        ? galleryData
        : galleryData.filter(img => img.category === filter);

    const categories = ['all', 'ceremony', 'festival', 'education', 'daily'];

    // Map filtered images to slides for lightbox
    const slides = filteredImages.map(img => ({
        src: img.src,
        title: img.caption[locale as 'th' | 'en'],
    }));

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            {/* Header */}
            <div className="bg-primary text-white pt-40 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/images/thai-pattern.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
                <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">{t('title')}</h1>
                    <p className="text-xl font-light opacity-90">{t('subtitle')}</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${filter === cat
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700'
                                }`}
                        >
                            {t(cat)}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredImages.map((img, idx) => (
                            <motion.div
                                layout
                                key={img.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => setIndex(idx)}
                                className="group relative aspect-4/3 rounded-xl overflow-hidden cursor-pointer shadow-md bg-white dark:bg-zinc-900 border border-gray-100 dark:border-gray-800"
                            >
                                {/* Placeholder for Image - in real app use next/image */}
                                <div className="absolute inset-0 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500">
                                    <span className="text-lg font-medium">[Image: {img.src}]</span>
                                </div>

                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <p className="text-white font-medium translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-center w-full">
                                        {img.caption[locale as 'th' | 'en']}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                <Lightbox
                    index={index}
                    slides={slides}
                    open={index >= 0}
                    close={() => setIndex(-1)}
                />
            </div>
        </div>
    );
}
