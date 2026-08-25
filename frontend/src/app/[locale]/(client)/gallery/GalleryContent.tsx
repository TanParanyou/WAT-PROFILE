"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { getLocalizedText } from "@/utils/i18n";
import { PublicImage } from "@/components/public/media/PublicImage";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { EmptyState } from "@/components/public/states/EmptyState";
import { PublicLightboxModal } from "@/components/public/modal";
import {
  usePublicGalleryCategoriesQuery,
  usePublicGalleryQuery,
} from "@/features/public/gallery/queries";
import type { PublicContentPage } from "@/types/website-cms";
import { STATIC_ASSETS } from "@/constants/assets";

const galleryFallbackImage = STATIC_ASSETS.GALLERY.FALLBACK;

export default function GalleryContent({ cmsPage }: { cmsPage: PublicContentPage | null }) {
  const t = useTranslations("GalleryPage");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState("all");
  const [index, setIndex] = useState(-1);
  const galleryQuery = usePublicGalleryQuery();
  const categoriesQuery = usePublicGalleryCategoriesQuery();
  const title = cmsPage ? getLocalizedText(cmsPage.title, locale) || t("title") : t("title");
  const subtitle = cmsPage
    ? getLocalizedText(cmsPage.description, locale) || t("subtitle")
    : t("subtitle");
  const images = galleryQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const activeCategoryId = categories.some((category) => String(category.id) === filter)
    ? filter
    : "all";
  const filteredImages =
    activeCategoryId === "all"
      ? images
      : images.filter((image) => String(image.category_id) === activeCategoryId);
  const slides = filteredImages.map((image) => ({
    src: image.image_url || image.thumbnail_url || galleryFallbackImage,
    title: getLocalizedText(image.caption, locale),
  }));
  const heroImage = images[0]?.image_url || images[0]?.thumbnail_url;
  const isLoading = galleryQuery.isLoading || categoriesQuery.isLoading;
  const hasError = galleryQuery.isError || categoriesQuery.isError;

  const retry = () => {
    void galleryQuery.refetch();
    void categoriesQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader
        variant={heroImage ? "image" : "color"}
        align="left"
        title={title}
        subtitle={subtitle}
        imageSrc={heroImage}
        imageAlt={title}
      />
      <PageContainer width="wide">
        {!isLoading ? (
          <div
            className="-mx-4 mb-10 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
            role="group"
            aria-label={t("filterLabel")}
          >
            <div className="flex min-w-max gap-3 sm:min-w-0 sm:flex-wrap">
              <CategoryButton
                active={activeCategoryId === "all"}
                onClick={() => setFilter("all")}
              >
                {t("allCategories")}
              </CategoryButton>
              {categories.map((category) => (
                <CategoryButton
                  key={category.id}
                  active={activeCategoryId === String(category.id)}
                  onClick={() => setFilter(String(category.id))}
                >
                  {getLocalizedText(category.name, locale)}
                </CategoryButton>
              ))}
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            aria-label={t("loading")}
          >
            {Array.from({ length: 6 }, (_, item) => (
              <div key={item} className="aspect-[4/3] animate-pulse bg-site-surface" />
            ))}
          </div>
        ) : hasError ? (
          <QueryErrorState
            title={t("errorTitle")}
            description={t("errorDescription")}
            retryLabel={t("retry")}
            onRetry={retry}
            isRetrying={galleryQuery.isFetching || categoriesQuery.isFetching}
          />
        ) : filteredImages.length === 0 ? (
          <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredImages.map((image, imageIndex) => {
                const caption =
                  getLocalizedText(image.caption, locale) || t("imageUnavailable");

                return (
                  <motion.button
                    type="button"
                    layout
                    key={image.id}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    onClick={() => setIndex(imageIndex)}
                    className="group overflow-hidden border border-site-border bg-site-canvas text-left transition-colors hover:border-site-accent focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                  >
                    <span className="relative block aspect-[4/3] overflow-hidden bg-site-surface">
                      <PublicImage
                        src={image.image_url || image.thumbnail_url}
                        alt={caption}
                        fill
                        fallbackSrc={galleryFallbackImage}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    </span>
                    <span className="block px-4 py-3 text-sm leading-6 text-site-body">
                      {caption}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Central Public Lightbox Modal with Carousel and Thumbnails */}
        <PublicLightboxModal
          open={index >= 0}
          initialIndex={index >= 0 ? index : 0}
          onClose={() => setIndex(-1)}
          slides={slides}
          closeLabel={t("close") || "Close"}
        />
      </PageContainer>
    </div>
  );
}

function CategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 border px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus ${
        active
          ? "border-site-border bg-site-action text-site-on-action"
          : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
      }`}
    >
      {children}
    </button>
  );
}
