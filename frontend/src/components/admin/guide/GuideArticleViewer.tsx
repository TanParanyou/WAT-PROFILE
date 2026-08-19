"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { GuideIcon, getStatusBadgeClasses } from "./guideIcons";
import { GuidePrintHeader } from "./GuidePrintHeader";
import { GuideQuickLinks } from "./GuideQuickLinks";
import {
  Printer,
  ChevronDown,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import type { GuideArticle } from "@/types/adminGuide";

interface GuideArticleViewerProps {
  article: GuideArticle;
}

export function GuideArticleViewer({ article }: GuideArticleViewerProps) {
  const locale = useLocale() as "th" | "en" | "de";
  const t = useTranslations("Admin.guide");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

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
          {article.steps.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-admin-surface border border-admin-border p-6 space-y-3 break-inside-avoid shadow-2xs"
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
          ))}
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
    </article>
  );
}
