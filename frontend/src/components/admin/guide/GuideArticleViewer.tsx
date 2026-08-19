"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { GuideIcon, getStatusBadgeClasses } from "./guideIcons";
import { GuidePrintHeader } from "./GuidePrintHeader";
import { GuideQuickLinks } from "./GuideQuickLinks";
import {
  Printer,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ZoomIn,
  X,
  ImageIcon,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import type { GuideArticle, GuideStep, GuideImage } from "@/types/adminGuide";
import { usePermission } from "@/hooks/usePermission";
import { Link } from "@/navigation";

interface GuideArticleViewerProps {
  article: GuideArticle;
}

interface ActiveLightboxState {
  images: GuideImage[];
  currentIndex: number;
}

export function GuideArticleViewer({ article }: GuideArticleViewerProps) {
  const locale = useLocale() as "th" | "en" | "de";
  const t = useTranslations("Admin.guide");
  const { isSuperAdmin } = usePermission();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<ActiveLightboxState | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Helper to extract normalized images from a step
  const getStepImages = useCallback((step: GuideStep): GuideImage[] => {
    if (step.images && step.images.length > 0) {
      return step.images;
    }
    if (step.image) {
      return [
        {
          src: step.image,
          caption: step.imageCaption,
          alt: step.imageCaption || step.title,
        },
      ];
    }
    return [];
  }, []);

  const openLightbox = (images: GuideImage[], startIndex = 0) => {
    setLightbox({
      images,
      currentIndex: startIndex,
    });
  };

  const nextLightboxImage = useCallback(() => {
    if (!lightbox) return;
    setLightbox((prev) =>
      prev
        ? {
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length,
          }
        : null,
    );
  }, [lightbox]);

  const prevLightboxImage = useCallback(() => {
    if (!lightbox) return;
    setLightbox((prev) =>
      prev
        ? {
            ...prev,
            currentIndex:
              prev.currentIndex === 0
                ? prev.images.length - 1
                : prev.currentIndex - 1,
          }
        : null,
    );
  }, [lightbox]);

  // Handle keyboard shortcuts in Lightbox (ESC, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") {
        setLightbox(null);
      } else if (e.key === "ArrowRight") {
        nextLightboxImage();
      } else if (e.key === "ArrowLeft") {
        prevLightboxImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox, nextLightboxImage, prevLightboxImage]);

  // If article is superAdminOnly and current user is not superadmin, show restricted view
  if (article.superAdminOnly && !isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-admin-surface border border-admin-danger/30 p-8 space-y-6 text-center shadow-2xs">
        <div className="w-14 h-14 mx-auto bg-admin-danger-surface text-admin-danger flex items-center justify-center border border-admin-danger/30">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-admin-foreground">
            {t("superAdminOnlyTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-admin-muted leading-relaxed max-w-lg mx-auto">
            {t("superAdminOnlyDesc")}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin/guide"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-admin-surface border border-admin-border hover:bg-admin-surface-muted text-admin-foreground text-xs sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus min-h-11 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{t("backToHub")}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto space-y-8 print:space-y-4">
      {/* Print-only Header */}
      <GuidePrintHeader
        articleTitle={article.title[locale]}
        categoryTitle={article.category}
      />

      {/* Main Header / Hero */}
      <div className="bg-admin-surface border border-admin-border p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-admin-surface-muted border border-admin-border text-admin-action">
              <GuideIcon name={article.iconName} size={24} />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-admin-muted bg-admin-surface-muted px-2 py-0.5 border border-admin-border">
                {article.category}
              </span>
              <span className="text-xs text-admin-muted ml-2">
                {t("lastUpdated")}: {article.updatedAt}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-admin-surface border border-admin-border hover:bg-admin-surface-muted text-admin-foreground text-xs sm:text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus min-h-10 cursor-pointer"
            >
              <Printer size={16} />
              <span>{t("exportPdf")}</span>
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-admin-foreground tracking-tight">
          {article.title[locale]}
        </h1>

        <p className="text-sm sm:text-base text-admin-body leading-relaxed max-w-3xl">
          {article.summary[locale]}
        </p>
      </div>

      {/* Quick Checklist Steps Box */}
      {article.quickSteps && article.quickSteps.length > 0 && (
        <section className="bg-admin-surface-muted/50 border border-admin-border p-6 space-y-3 print:border-black/20">
          <div className="flex items-center gap-2 text-sm font-bold text-admin-foreground uppercase tracking-wider">
            <CheckCircle2 size={18} className="text-admin-action" />
            <h2>{t("quickSteps")}</h2>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {article.quickSteps.map((step, idx) => (
              <li
                key={idx}
                className="bg-admin-surface border border-admin-border p-3.5 text-xs sm:text-sm text-admin-body flex items-start gap-2.5 shadow-2xs"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-none bg-admin-action text-white flex items-center justify-center font-bold text-[11px]">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step[locale]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Status Legends Table (if available) */}
      {article.statusLegends && article.statusLegends.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-admin-foreground uppercase tracking-wider">
            <h2>{t("statusLegend")}</h2>
          </div>
          <div className="border border-admin-border overflow-x-auto bg-admin-surface">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-admin-surface-muted border-b border-admin-border text-admin-muted font-medium">
                <tr>
                  <th className="p-3 w-40">{t("statusHeader")}</th>
                  <th className="p-3">{t("meaningHeader")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/50">
                {article.statusLegends.map((legend, idx) => (
                  <tr key={idx} className="hover:bg-admin-surface-muted/30">
                    <td className="p-3 align-top font-medium">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs border font-medium ${getStatusBadgeClasses(
                          legend.badgeVariant,
                        )}`}
                      >
                        {legend.label[locale]}
                      </span>
                    </td>
                    <td className="p-3 align-top text-admin-body leading-relaxed">
                      {legend.meaning[locale]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Step by step procedure */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-admin-border pb-3">
          <h2 className="text-lg font-bold text-admin-foreground">
            {t("stepByStep")}
          </h2>
          <span className="text-xs text-admin-muted">
            {t("stepsCount", { count: article.steps.length })}
          </span>
        </div>

        <div className="space-y-6">
          {article.steps.map((step) => {
            const stepImages = getStepImages(step);

            return (
              <div
                key={step.stepNumber}
                className="bg-admin-surface border border-admin-border p-6 space-y-4 break-inside-avoid shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-admin-surface-muted border border-admin-border text-admin-foreground font-bold flex items-center justify-center text-sm">
                    {step.stepNumber}
                  </div>
                  <h3 className="text-base font-bold text-admin-foreground">
                    {step.title[locale]}
                  </h3>
                </div>

                <p className="text-sm text-admin-body leading-relaxed pl-10">
                  {step.description[locale]}
                </p>

                {/* Single or Multi-Image Gallery */}
                {stepImages.length > 0 && (
                  <div className="ml-10 space-y-3">
                    {stepImages.length === 1 ? (
                      /* Single Image Layout */
                      <div className="space-y-1.5">
                        <div
                          onClick={() => openLightbox(stepImages, 0)}
                          className="group relative cursor-pointer border border-admin-border bg-admin-surface-muted/60 overflow-hidden max-w-xl transition-all hover:border-admin-action shadow-2xs"
                        >
                          <img
                            src={stepImages[0].src}
                            alt={stepImages[0].alt?.[locale] || step.title[locale]}
                            className="w-full max-h-72 object-contain bg-admin-surface transition-transform duration-200 group-hover:scale-[1.01]"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 print:hidden">
                            <div className="px-3 py-1.5 bg-admin-surface border border-admin-border text-admin-foreground text-xs font-semibold flex items-center gap-1.5 shadow-md">
                              <ZoomIn size={14} className="text-admin-action" />
                              <span>{t("viewImageFull")}</span>
                            </div>
                          </div>
                        </div>
                        {stepImages[0].caption && (
                          <p className="text-xs text-admin-muted italic flex items-center gap-1.5 pl-1">
                            <ImageIcon size={13} className="text-admin-muted flex-shrink-0" />
                            <span>{stepImages[0].caption[locale]}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Multi-Image Grid Layout */
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-admin-muted flex items-center gap-1.5">
                          <ImageIcon size={14} className="text-admin-action" />
                          <span>{t("imageGallery", { count: stepImages.length })}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {stepImages.map((img, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => openLightbox(stepImages, imgIdx)}
                              className="group relative cursor-pointer border border-admin-border bg-admin-surface-muted/40 overflow-hidden transition-all hover:border-admin-action shadow-2xs flex flex-col justify-between"
                            >
                              <div className="relative aspect-16/10 bg-admin-surface flex items-center justify-center overflow-hidden">
                                <img
                                  src={img.src}
                                  alt={img.alt?.[locale] || `Step image ${imgIdx + 1}`}
                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 print:hidden">
                                  <div className="p-1.5 bg-admin-surface border border-admin-border text-admin-foreground text-xs shadow-md">
                                    <ZoomIn size={14} className="text-admin-action" />
                                  </div>
                                </div>
                                <span className="absolute top-1.5 right-1.5 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5">
                                  {imgIdx + 1}/{stepImages.length}
                                </span>
                              </div>
                              {img.caption && (
                                <p className="p-2 text-[11px] text-admin-muted line-clamp-1 bg-admin-surface border-t border-admin-border">
                                  {img.caption[locale]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tip box */}
                {step.tip && (
                  <div className="ml-10 p-3.5 bg-admin-surface-muted border-l-3 border-admin-action text-xs text-admin-foreground flex items-start gap-2.5">
                    <Lightbulb size={16} className="text-admin-action flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">{t("tip")}:</strong>
                      <span>{step.tip[locale]}</span>
                    </div>
                  </div>
                )}

                {/* Warning box */}
                {step.warning && (
                  <div className="ml-10 p-3.5 bg-admin-danger-surface border-l-3 border-admin-danger text-xs text-admin-danger flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-admin-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">{t("warning")}:</strong>
                      <span>{step.warning[locale]}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      {article.faqs && article.faqs.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-admin-border">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-admin-action" />
            <h2 className="text-lg font-bold text-admin-foreground">
              {t("faqs")}
            </h2>
          </div>

          <div className="space-y-2">
            {article.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-admin-border bg-admin-surface overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-admin-foreground hover:bg-admin-surface-muted transition-colors cursor-pointer"
                  >
                    <span>{faq.question[locale]}</span>
                    <ChevronDown
                      size={16}
                      className={`text-admin-muted transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-admin-action" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-admin-body leading-relaxed border-t border-admin-border/40 bg-admin-surface-muted/30">
                      {faq.answer[locale]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Related Guides Links */}
      {article.relatedSlugs && article.relatedSlugs.length > 0 && (
        <GuideQuickLinks relatedSlugs={article.relatedSlugs} />
      )}

      {/* Interactive Lightbox Modal with Multi-Image Carousel */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-admin-backdrop backdrop-blur-md animate-in fade-in duration-150 print:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setLightbox(null)}
          />
          <div className="relative max-w-5xl w-full bg-admin-surface border border-admin-border shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-admin-border bg-admin-surface-muted">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <span className="text-xs sm:text-sm font-semibold text-admin-foreground truncate">
                  {lightbox.images[lightbox.currentIndex]?.caption?.[locale] ||
                    lightbox.images[lightbox.currentIndex]?.alt?.[locale] ||
                    t("viewImageFull")}
                </span>
                {lightbox.images.length > 1 && (
                  <span className="px-2 py-0.5 text-[11px] font-mono bg-admin-surface border border-admin-border text-admin-muted flex-shrink-0">
                    {t("imageOf", {
                      current: lightbox.currentIndex + 1,
                      total: lightbox.images.length,
                    })}
                  </span>
                )}
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="p-1.5 text-admin-muted hover:text-admin-foreground hover:bg-admin-surface border border-transparent hover:border-admin-border transition-colors cursor-pointer"
                title={t("closeImage")}
              >
                <X size={18} />
              </button>
            </div>

            {/* Lightbox Main Image Display */}
            <div className="relative p-4 overflow-auto flex-1 flex items-center justify-center bg-black/5 min-h-75">
              <img
                src={lightbox.images[lightbox.currentIndex]?.src}
                alt={
                  lightbox.images[lightbox.currentIndex]?.alt?.[locale] ||
                  "Screenshot Preview"
                }
                className="max-h-[72vh] w-auto max-w-full object-contain border border-admin-border bg-admin-surface shadow-md"
              />

              {/* Navigation Arrows for Multi-Image */}
              {lightbox.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevLightboxImage();
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-2.5 bg-admin-surface/90 hover:bg-admin-surface text-admin-foreground border border-admin-border shadow-lg transition-all hover:scale-105 cursor-pointer"
                    title={t("prevImage")}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextLightboxImage();
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 bg-admin-surface/90 hover:bg-admin-surface text-admin-foreground border border-admin-border shadow-lg transition-all hover:scale-105 cursor-pointer"
                    title={t("nextImage")}
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Footer Thumbnails (if > 1 image) */}
            {lightbox.images.length > 1 && (
              <div className="p-3 bg-admin-surface-muted border-t border-admin-border flex items-center justify-center gap-2 overflow-x-auto">
                {lightbox.images.map((thumb, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setLightbox((prev) =>
                        prev ? { ...prev, currentIndex: idx } : null,
                      )
                    }
                    className={`w-14 h-10 border transition-all overflow-hidden flex-shrink-0 cursor-pointer ${
                      idx === lightbox.currentIndex
                        ? "border-admin-action ring-2 ring-admin-action/30 scale-105"
                        : "border-admin-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={thumb.src}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
