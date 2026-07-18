'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import { getLocalizedText } from '@/utils/i18n';
import { PublicImage } from '@/components/public/media/PublicImage';
import { QueryErrorState } from '@/components/public/states/QueryErrorState';
import { EmptyState } from '@/components/public/states/EmptyState';
import { usePublicGalleryCategoriesQuery, usePublicGalleryQuery } from '@/features/public/gallery/queries';
import type { PublicContentPage } from '@/types/website-cms';

const galleryFallbackImage = '/images/og-image.jpg';

export default function GalleryContent({ cmsPage }: { cmsPage: PublicContentPage | null }) {
  const t = useTranslations('GalleryPage');
  const locale = useLocale();
  const [filter, setFilter] = useState('all');
  const [index, setIndex] = useState(-1);
  const galleryQuery = usePublicGalleryQuery();
  const categoriesQuery = usePublicGalleryCategoriesQuery();
  const title = cmsPage ? getLocalizedText(cmsPage.title, locale) || t('title') : t('title');
  const subtitle = cmsPage ? getLocalizedText(cmsPage.description, locale) || t('subtitle') : t('subtitle');
  const images = galleryQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const activeCategoryId = categories.some((category) => String(category.id) === filter) ? filter : 'all';
  const filteredImages = activeCategoryId === 'all'
    ? images
    : images.filter((image) => String(image.category_id) === activeCategoryId);
  const slides = filteredImages.map((image) => ({
    src: image.image_url || image.thumbnail_url || galleryFallbackImage,
    title: getLocalizedText(image.caption, locale),
  }));
  const isLoading = galleryQuery.isLoading || categoriesQuery.isLoading;
  const hasError = galleryQuery.isError || categoriesQuery.isError;
  const retry = () => {
    void galleryQuery.refetch();
    void categoriesQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageHeader title={title} subtitle={subtitle} />
      <PageContainer>
        <div className="min-h-[400px] overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-zinc-900 md:p-8">
          {!isLoading && (
            <div className="mb-12 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => setFilter('all')} className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${activeCategoryId === 'all' ? 'scale-105 bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'}`}>
                {t('allCategories')}
              </button>
              {categories.map((category) => (
                <button type="button" key={category.id} onClick={() => setFilter(String(category.id))} className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${activeCategoryId === String(category.id) ? 'scale-105 bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700'}`}>
                  {getLocalizedText(category.name, locale)}
                </button>
              ))}
            </div>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label={t('loading')}>
              {Array.from({ length: 6 }, (_, item) => <div key={item} className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-200 dark:bg-zinc-800" />)}
            </div>
          ) : hasError ? (
            <QueryErrorState title={t('errorTitle')} description={t('errorDescription')} retryLabel={t('retry')} onRetry={retry} isRetrying={galleryQuery.isFetching || categoriesQuery.isFetching} />
          ) : filteredImages.length === 0 ? (
            <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
          ) : (
            <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredImages.map((image, imageIndex) => (
                  <motion.button type="button" layout key={image.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }} onClick={() => setIndex(imageIndex)} className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-gray-100 text-left shadow-sm transition-all hover:shadow-lg dark:bg-zinc-800">
                    <PublicImage src={image.image_url || image.thumbnail_url} alt={getLocalizedText(image.caption, locale) || t('imageUnavailable')} fill fallbackSrc={galleryFallbackImage} sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <p className="w-full text-center font-medium text-white">{getLocalizedText(image.caption, locale)}</p>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          <Lightbox index={index} slides={slides} open={index >= 0} close={() => setIndex(-1)} />
        </div>
      </PageContainer>
    </div>
  );
}
