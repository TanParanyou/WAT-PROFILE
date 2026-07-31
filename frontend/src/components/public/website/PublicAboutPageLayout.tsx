"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { AboutContentFormData } from "@/types/public-content";
import { getLocalizedText } from "@/utils/localizedText";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import PageNavigation from "@/components/layout/PageNavigation";
import { PublicSectionHeading } from "@/components/public/layout/PublicSectionHeading";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { usePublicMonksQuery } from "@/features/public/monks/queries";
import { toMonkListItem } from "@/features/public/monks/mappers";
import { MonksGrid } from "@/features/public/monks/components/MonksGrid";

export function PublicAboutPageLayout({ page }: { page: AboutContentFormData | null }) {
  const t = useTranslations("AboutPage");
  const locale = useLocale();
  const monksQuery = usePublicMonksQuery();
  const activeMonks = monksQuery.data?.map(toMonkListItem) ?? [];
  const navItems = useMemo(
    () => [
      { id: "intro", label: t("sections.intro") },
      { id: "objective", label: t("sections.objective") },
      { id: "administration", label: t("sections.administration") },
      { id: "history", label: t("sections.history") },
      { id: "buildings", label: t("sections.buildings") },
      { id: "sangha", label: t("sections.sangha") },
    ],
    [t],
  );

  const text = (value: Parameters<typeof getLocalizedText>[0] | undefined) =>
    value ? getLocalizedText(value, locale) : "";
  const pageTitle = page ? text(page.title) || t("title") : t("title");
  const pageSubtitle = page ? text(page.description) || t("subtitle") : t("subtitle");
  const intro = page?.body.intro;
  const objective = page?.body.objective;
  const administration = page?.body.administration;
  const history = page?.body.history;
  const buildings = page?.body.buildings;
  const buildingItems = buildings?.items ?? [];
  const sangha = page?.body.sangha;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader variant="color" align="left" title={pageTitle} subtitle={pageSubtitle} />
      <PageContainer width="wide">
        <div className="relative flex flex-col gap-10 lg:flex-row lg:gap-16">
          <aside className="shrink-0 lg:w-64">
            <PageNavigation items={navItems} />
          </aside>

          <div className="min-w-0 flex-1">
            {intro && (text(intro.heading) || text(intro.description)) ? (
              <section id="intro" className="scroll-mt-28 border-t-2 border-secondary pt-8">
                <PublicSectionHeading title={text(intro.heading)} />
                <div className="mt-7 max-w-[75ch] whitespace-pre-wrap text-lg leading-9 text-text-800">
                  {text(intro.description)}
                </div>
                {text(intro.founded) || text(intro.location) ? (
                  <div className="mt-10 rounded-2xl bg-primary-50 p-6 md:p-8">
                    {text(intro.founded) ? (
                      <h3 className="font-heading text-xl font-bold text-primary-800">
                        {text(intro.founded)}
                      </h3>
                    ) : null}
                    {text(intro.location) ? (
                      <p className="mt-3 max-w-[65ch] whitespace-pre-wrap leading-8 text-text-800">
                        {text(intro.location)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {objective && (text(objective.heading) || objective.content) ? (
              <section id="objective" className="mt-20 scroll-mt-28 border-y border-[#333] bg-[#333] p-8 text-[#fffef2] md:p-12">
                <h2 className="max-w-[18ch] font-heading text-[clamp(2.3rem,4.8vw,4.7rem)] font-normal leading-[1.14] text-balance">
                  {text(objective.heading)}
                </h2>
                {text(objective.subtitle) ? (
                  <p className="mt-5 max-w-[65ch] text-lg leading-8 text-[#fffef2]/80">
                    {text(objective.subtitle)}
                  </p>
                ) : null}
                {objective.content ? (
                  <div className="prose prose-lg prose-invert mt-10 max-w-[75ch]">
                    <RichTextContent value={objective.content} locale={locale} defaultLocale="th" />
                  </div>
                ) : null}
              </section>
            ) : null}

            {administration && (text(administration.heading) || administration.content) ? (
              <section id="administration" className="mt-20 scroll-mt-28 border-t border-primary/15 pt-12">
                <PublicSectionHeading title={text(administration.heading)} />
                {administration.content ? (
                  <div className="prose prose-lg mt-8 max-w-[75ch] dark:prose-invert">
                    <RichTextContent
                      value={administration.content}
                      locale={locale}
                      defaultLocale="th"
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            {history && (text(history.heading) || history.content) ? (
              <section id="history" className="mt-20 scroll-mt-28 border-t border-primary/15 pt-12">
                <PublicSectionHeading title={text(history.heading)} />
                {history.content ? (
                  <div className="prose prose-lg mt-8 max-w-[75ch] dark:prose-invert">
                    <RichTextContent value={history.content} locale={locale} defaultLocale="th" />
                  </div>
                ) : null}
              </section>
            ) : null}

            {buildings && (text(buildings.heading) || buildingItems.length > 0) ? (
              <section id="buildings" className="mt-20 scroll-mt-28 border-t border-primary/15 pt-12">
                <PublicSectionHeading title={text(buildings.heading)} />
                <ol className="mt-10 grid gap-8 md:grid-cols-2">
                  {buildingItems.map((building, index) => (
                    <li key={`${text(building.name)}-${index}`} className="border-t border-primary/20 pt-5">
                      <span className="text-sm font-semibold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-3 font-heading text-2xl font-bold text-text-900">
                        {text(building.name)}
                      </h3>
                      <p className="mt-3 leading-8 text-text-800">{text(building.description)}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {sangha && (text(sangha.heading) || text(sangha.mission) || sangha.content) ? (
              <section
                id="sangha"
                className="mt-20 scroll-mt-28 rounded-2xl bg-secondary-50 p-8 md:p-12"
              >
                <PublicSectionHeading title={text(sangha.heading)} />
                {text(sangha.mission) ? (
                  <p className="mt-7 max-w-[75ch] whitespace-pre-wrap text-lg leading-9 text-text-800">
                    {text(sangha.mission)}
                  </p>
                ) : null}
                {sangha.content ? (
                  <div className="prose prose-lg mt-8 max-w-[75ch] dark:prose-invert">
                    <RichTextContent value={sangha.content} locale={locale} defaultLocale="th" />
                  </div>
                ) : null}
                {activeMonks.length > 0 ? (
                  <div className="mt-12 border-t border-secondary/20 pt-10">
                    <MonksGrid monks={activeMonks} />
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
