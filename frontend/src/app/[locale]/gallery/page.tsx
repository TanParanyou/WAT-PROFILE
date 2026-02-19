'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import galleryData from '@/data/gallery.json';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import { getLocalizedText } from '@/utils/i18n';
import categoriesData from '@/data/categories.json';

export default function GalleryPage() {
    const t = useTranslations('GalleryPage');
    const locale = useLocale();
    const [filter, setFilter] = useState('all');
    const [index, setIndex] = useState(-1);

    const filteredImages = filter === 'all'
        ? galleryData.filter(img => img.active)
        : galleryData.filter(img => img.category === filter && img.active);

    const categories = categoriesData;

    // Map filtered images to slides for lightbox
    const slides = filteredImages.map(img => ({
        src: img.src,
        title: getLocalizedText(img.caption, locale),
    }));

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <PageContainer>
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 md:p-8 min-h-[400px]">
                    {/* Filters */}
                    <div className="flex flex-wrap justify-center gap-3 mb-12">
                        {categories.filter(cat => cat.active).map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setFilter(cat.id)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === cat.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                                    }`}
                            >
                                {getLocalizedText(cat.name, locale)}
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
                                    className="group relative aspect-4/3 rounded-2xl overflow-hidden cursor-pointer bg-gray-100 dark:bg-zinc-800 shadow-sm hover:shadow-lg transition-all"
                                >
                                    {/* Placeholder for Image - in real app use next/image */}
                                    <div className="absolute inset-0 bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500">
                                        <img
                                            src={img.src}
                                            alt={img.caption[locale as 'th' | 'en']}
                                            className="w-full h-full object-cover"
                                        />
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
            </PageContainer>
        </div>
    );
}
