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
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="color" align="left" title={pageTitle} subtitle={pageSubtitle} />

      <PageContainer width="wide">
        <div className="relative flex flex-col gap-12 lg:grid lg:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)] lg:gap-16">
          <aside className="shrink-0">
            <PageNavigation items={navItems} />
          </aside>

          <div className="min-w-0 space-y-24">
            {intro && (text(intro.heading) || text(intro.description)) ? (
              <section id="intro" className="scroll-mt-32">
                <PublicSectionHeading title={text(intro.heading)} />
                <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(14rem,0.75fr)] lg:gap-16">
                  <div className="max-w-[68ch] whitespace-pre-wrap text-lg leading-8 text-site-body text-pretty">
                    {text(intro.description)}
                  </div>

                  {text(intro.founded) || text(intro.location) ? (
                    <dl className="border-y border-site-border">
                      {text(intro.founded) ? (
                        <div className="border-b border-site-border py-5 last:border-b-0">
                          <dt className="text-sm font-medium text-site-accent">{t("foundedLabel")}</dt>
                          <dd className="mt-2 leading-7 text-site-foreground">{text(intro.founded)}</dd>
                        </div>
                      ) : null}
                      {text(intro.location) ? (
                        <div className="py-5">
                          <dt className="text-sm font-medium text-site-accent">{t("locationLabel")}</dt>
                          <dd className="mt-2 whitespace-pre-wrap leading-7 text-site-body">{text(intro.location)}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </div>
              </section>
            ) : null}

            {objective && (text(objective.heading) || objective.content) ? (
              <section
                id="objective"
                className="scroll-mt-32 border-y border-site-border bg-site-action px-7 py-9 text-site-on-action md:px-12 md:py-12"
              >
                <div className="max-w-4xl">
                  <p className="text-sm font-medium tracking-[0.14em] text-site-on-action/70">
                    {t("sections.objective")}
                  </p>
                  <h2 className="mt-5 max-w-[20ch] font-heading text-[clamp(2.3rem,4.8vw,4.7rem)] font-normal leading-[1.14] text-balance">
                    {text(objective.heading)}
                  </h2>
                  {text(objective.subtitle) ? (
                    <p className="mt-5 max-w-[65ch] text-lg leading-8 text-site-on-action/80">
                      {text(objective.subtitle)}
                    </p>
                  ) : null}
                  {objective.content ? (
                    <RichTextContent
                      value={objective.content}
                      locale={locale}
                      defaultLocale="th"
                      className="mt-9 max-w-[75ch] text-lg leading-8 text-site-on-action"
                    />
                  ) : null}
                </div>
              </section>
            ) : null}

            {administration && (text(administration.heading) || administration.content) ? (
              <section id="administration" className="scroll-mt-32">
                <PublicSectionHeading title={text(administration.heading)} />
                {administration.content ? (
                  <RichTextContent
                    value={administration.content}
                    locale={locale}
                    defaultLocale="th"
                    className="mt-8 max-w-[75ch] text-lg leading-8"
                  />
                ) : null}
              </section>
            ) : null}

            {history && (text(history.heading) || history.content) ? (
              <section id="history" className="scroll-mt-32">
                <PublicSectionHeading title={text(history.heading)} />
                {history.content ? (
                  <RichTextContent
                    value={history.content}
                    locale={locale}
                    defaultLocale="th"
                    className="mt-8 max-w-[75ch] text-lg leading-8"
                  />
                ) : null}
              </section>
            ) : null}

            {buildings && (text(buildings.heading) || buildingItems.length > 0) ? (
              <section id="buildings" className="scroll-mt-32">
                <PublicSectionHeading title={text(buildings.heading)} />
                <ol className="mt-10 border-y border-site-border">
                  {buildingItems.map((building, index) => (
                    <li
                      key={`${text(building.name)}-${index}`}
                      className="grid gap-4 border-b border-site-border py-7 last:border-b-0 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-8"
                    >
                      <span className="font-mono text-sm font-medium text-site-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-heading text-2xl font-medium leading-tight text-site-foreground">
                          {text(building.name)}
                        </h3>
                        <p className="mt-3 max-w-[65ch] leading-8 text-site-body">
                          {text(building.description)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {sangha && (text(sangha.heading) || text(sangha.mission) || sangha.content) ? (
              <section
                id="sangha"
                className="scroll-mt-32 border-y border-site-border bg-site-surface px-7 py-9 md:px-12 md:py-12"
              >
                <PublicSectionHeading title={text(sangha.heading)} />
                {text(sangha.mission) ? (
                  <p className="mt-7 max-w-[75ch] whitespace-pre-wrap text-lg leading-8 text-site-body">
                    {text(sangha.mission)}
                  </p>
                ) : null}
                {sangha.content ? (
                  <RichTextContent
                    value={sangha.content}
                    locale={locale}
                    defaultLocale="th"
                    className="mt-8 max-w-[75ch] text-lg leading-8"
                  />
                ) : null}
                {activeMonks.length > 0 ? (
                  <div className="mt-12 border-t border-site-border pt-10">
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
