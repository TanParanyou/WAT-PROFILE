'use client';

import { Quote } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { AboutContentFormData } from '@/types/public-content';
import { getLocalizedText } from '@/utils/localizedText';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import PageNavigation from '@/components/layout/PageNavigation';
import { RichTextContent } from '@/components/admin/rich-text/RichTextContent';
import { usePublicMonksQuery } from '@/features/public/monks/queries';
import { toMonkListItem } from '@/features/public/monks/mappers';
import { MonksGrid } from '@/features/public/monks/components/MonksGrid';

export function PublicAboutPageLayout({ page }: { page: AboutContentFormData | null }) {
  const t = useTranslations('AboutPage');
  const locale = useLocale();
  const monksQuery = usePublicMonksQuery();
  const activeMonks = monksQuery.data?.map(toMonkListItem) ?? [];
  const emptyText = { th: '', en: '', de: '' };

  const navItems = [
    { id: 'intro', label: t('sections.intro') },
    { id: 'objective', label: t('sections.objective') },
    { id: 'administration', label: t('sections.administration') },
    { id: 'history', label: t('sections.history') },
    { id: 'buildings', label: t('sections.buildings') },
    { id: 'sangha', label: t('sections.sangha') },
  ];

  const pageTitle = page ? getLocalizedText(page.title, locale) || t('title') : t('title');
  const pageSubtitle = page ? getLocalizedText(page.description, locale) || t('subtitle') : t('subtitle');

  const introTitle = page ? getLocalizedText(page.body.intro.heading, locale) : getLocalizedText(emptyText, locale);
  const introDescription = page ? getLocalizedText(page.body.intro.description, locale) : getLocalizedText(emptyText, locale);
  const introFounded = page ? getLocalizedText(page.body.intro.founded, locale) : getLocalizedText(emptyText, locale);
  const introLocation = page ? getLocalizedText(page.body.intro.location, locale) : getLocalizedText(emptyText, locale);

  const objectiveTitle = page ? getLocalizedText(page.body.objective.heading, locale) : getLocalizedText(emptyText, locale);
  const objectiveSubtitle = page ? getLocalizedText(page.body.objective.subtitle, locale) : getLocalizedText(emptyText, locale);

  const administrationTitle = page ? getLocalizedText(page.body.administration.heading, locale) : getLocalizedText(emptyText, locale);

  const historyTitle = page ? getLocalizedText(page.body.history.heading, locale) : getLocalizedText(emptyText, locale);

  const buildingsTitle = page ? getLocalizedText(page.body.buildings.heading, locale) : getLocalizedText(emptyText, locale);
  const buildingsItems = page ? page.body.buildings.items || [] : [];

  const sanghaTitle = page ? getLocalizedText(page.body.sangha.heading, locale) : getLocalizedText(emptyText, locale);
  const sanghaMission = page ? getLocalizedText(page.body.sangha.mission, locale) : getLocalizedText(emptyText, locale);

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 dark:bg-zinc-950">
      <PageHeader title={pageTitle} subtitle={pageSubtitle} />
      <PageContainer>
        <div className="relative flex flex-col gap-8 lg:flex-row lg:gap-12">
          <div className="shrink-0 lg:w-64">
            <div className="sticky top-24">
              <PageNavigation items={navItems} />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-24">
            <section id="intro" className="scroll-mt-24">
              <div className="border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-zinc-900 md:p-10">
                <article className="prose prose-lg max-w-none dark:prose-invert">
                  <h2 className="mb-6 font-heading text-3xl font-bold text-primary">{introTitle}</h2>
                  <div className="mb-8 whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300">
                    {introDescription}
                  </div>
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-8 dark:bg-primary/10">
                    <h3 className="mb-3 text-lg font-bold text-primary">{introFounded}</h3>
                    <div className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300">
                      {introLocation}
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section id="objective" className="scroll-mt-24 relative">
              <div className="absolute -left-6 -top-6 z-0 text-primary/10">
                <Quote size={120} />
              </div>
              <div className="relative z-10 border-l-[6px] border-primary bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-zinc-900 md:p-12">
                <article className="prose prose-lg max-w-none dark:prose-invert">
                  <h2 className="mb-2 font-heading text-2xl font-bold text-primary">{objectiveTitle}</h2>
                  <h3 className="mt-0 mb-8 text-lg font-medium text-gray-500 dark:text-gray-400">{objectiveSubtitle}</h3>
                  {page && page.body.objective.content ? (
                    <RichTextContent value={page.body.objective.content} locale={locale} defaultLocale="th" />
                  ) : (
                    <div className="whitespace-pre-wrap text-lg font-medium leading-loose italic text-gray-700 dark:text-gray-200">
                      {getLocalizedText(emptyText, locale)}
                    </div>
                  )}
                </article>
              </div>
            </section>

            <section id="administration" className="scroll-mt-24">
              <div className="border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-zinc-900 md:p-10">
                <article className="prose prose-lg max-w-none dark:prose-invert">
                  <h2 className="mb-6 font-heading text-2xl font-bold text-primary">{administrationTitle}</h2>
                  {page && page.body.administration.content ? (
                    <RichTextContent value={page.body.administration.content} locale={locale} defaultLocale="th" />
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300">
                      {getLocalizedText(emptyText, locale)}
                    </div>
                  )}
                </article>
              </div>
            </section>

            <section id="history" className="scroll-mt-24">
              <div className="border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-zinc-900 md:p-10">
                <article className="prose prose-lg max-w-none dark:prose-invert">
                  <h2 className="mb-6 font-heading text-2xl font-bold text-primary">{historyTitle}</h2>
                  {page && page.body.history.content ? (
                    <RichTextContent value={page.body.history.content} locale={locale} defaultLocale="th" />
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300">
                      {getLocalizedText(emptyText, locale)}
                    </div>
                  )}
                </article>
              </div>
            </section>

            <section id="buildings" className="scroll-mt-24">
              <div className="border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-zinc-900 md:p-10">
                <h2 className="mb-10 font-heading text-2xl font-bold text-gray-900 dark:text-white">{buildingsTitle}</h2>
                <div className="grid gap-10 md:grid-cols-1">
                  {buildingsItems.map((building, index) => (
                    <div key={index} className="group flex items-start gap-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="mb-3 font-heading text-xl font-bold text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                          {getLocalizedText(building.name, locale)}
                        </h3>
                        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                          {getLocalizedText(building.description, locale)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="sangha" className="scroll-mt-24">
              <div className="border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-zinc-900 md:p-10">
                <article className="prose prose-lg mb-12 max-w-none dark:prose-invert">
                  <h2 className="mb-6 font-heading text-2xl font-bold text-primary">{sanghaTitle}</h2>
                  <div className="mb-6 whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300">
                    {sanghaMission}
                  </div>
                  {page && page.body.sangha.content ? (
                    <RichTextContent value={page.body.sangha.content} locale={locale} defaultLocale="th" />
                  ) : (
                    <div className="whitespace-pre-wrap border-l-4 border-gray-200 pl-6 leading-relaxed text-gray-600 dark:border-gray-700 dark:text-gray-300">
                    {getLocalizedText(emptyText, locale)}
                    </div>
                  )}
                </article>

                {activeMonks.length > 0 ? <div className="not-prose mt-12 border-t border-gray-100 pt-12 dark:border-gray-800"><MonksGrid monks={activeMonks} /></div> : null}
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
