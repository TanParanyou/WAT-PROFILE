'use client';

import Image from 'next/image';
import { Quote } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import aboutData from '@/data/about.json';
import monksData from '@/data/monks.json';
import type { ContentSection, PublicContentPage } from '@/types/website-cms';
import { getLocalizedText } from '@/utils/localizedText';
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import PageNavigation from '@/components/layout/PageNavigation';

export function PublicAboutPageLayout({ page }: { page: PublicContentPage | null }) {
  const t = useTranslations('AboutPage');
  const locale = useLocale();
  const activeMonks = monksData.filter((m) => m.id !== '1');

  const introSection = pickSection(page?.sections, ['intro', 'history'], 'rich_text');
  const objectiveSection = pickSection(page?.sections, ['objective', 'quote'], 'quote');
  const administrationSection = pickSection(page?.sections, ['administration'], 'rich_text');
  const historySection = pickSection(page?.sections, ['history'], 'rich_text');
  const buildingsSection = pickSection(page?.sections, ['buildings'], 'item_list');
  const sanghaSection = pickSection(page?.sections, ['sangha'], 'monks_grid');

  const navItems = [
    { id: 'intro', label: getLocalizedText(aboutData.intro.navTitle, locale) },
    { id: 'objective', label: getLocalizedText(aboutData.objective.navTitle, locale) },
    { id: 'administration', label: getLocalizedText(aboutData.administration.navTitle, locale) },
    { id: 'history', label: getLocalizedText(aboutData.buddhaHistory.navTitle, locale) },
    { id: 'buildings', label: getLocalizedText(aboutData.buildings.title, locale) },
    { id: 'sangha', label: getLocalizedText(aboutData.sangha.navTitle, locale) },
  ];

  const pageTitle = page ? getLocalizedText(page.title, locale) || t('title') : t('title');
  const pageSubtitle = page ? getLocalizedText(page.description, locale) || t('subtitle') : t('subtitle');

  const introTitle = sectionText(introSection, 'title', locale) || getLocalizedText(aboutData.intro.title, locale);
  const introDescription =
    sectionText(introSection, 'description', locale) || getLocalizedText(aboutData.intro.description, locale);
  const introFounded = sectionText(introSection, 'body.founded', locale) || getLocalizedText(aboutData.intro.founded, locale);
  const introLocation = sectionText(introSection, 'body.location', locale) || getLocalizedText(aboutData.intro.location, locale);

  const objectiveTitle =
    sectionText(objectiveSection, 'title', locale) || getLocalizedText(aboutData.objective.title, locale);
  const objectiveSubtitle =
    sectionText(objectiveSection, 'description', locale) || getLocalizedText(aboutData.objective.subtitle, locale);
  const objectiveContent =
    sectionText(objectiveSection, 'body.quote', locale) || getLocalizedText(aboutData.objective.content, locale);

  const administrationTitle =
    sectionText(administrationSection, 'title', locale) || getLocalizedText(aboutData.administration.title, locale);
  const administrationContent =
    sectionText(administrationSection, 'description', locale) || getLocalizedText(aboutData.administration.content, locale);

  const historyTitle =
    sectionText(historySection, 'title', locale) || getLocalizedText(aboutData.buddhaHistory.title, locale);
  const historyContent =
    sectionText(historySection, 'description', locale) || getLocalizedText(aboutData.buddhaHistory.content, locale);

  const buildingsTitle = sectionText(buildingsSection, 'title', locale) || getLocalizedText(aboutData.buildings.title, locale);
  const buildingsItems = getBuildingItems(buildingsSection) || aboutData.buildings.items;

  const sanghaTitle = sectionText(sanghaSection, 'title', locale) || getLocalizedText(aboutData.sangha.title, locale);
  const sanghaMission =
    sectionText(sanghaSection, 'description', locale) || getLocalizedText(aboutData.sangha.mission, locale);
  const sanghaCurrentWork =
    sectionText(sanghaSection, 'body.markdown', locale) || getLocalizedText(aboutData.sangha.currentWork, locale);

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
                  <div className="whitespace-pre-wrap text-lg font-medium leading-loose italic text-gray-700 dark:text-gray-200">
                    {objectiveContent}
                  </div>
                </article>
              </div>
            </section>

            <section id="administration" className="scroll-mt-24">
              <div className="border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-zinc-900 md:p-10">
                <article className="prose prose-lg max-w-none dark:prose-invert">
                  <h2 className="mb-6 font-heading text-2xl font-bold text-primary">{administrationTitle}</h2>
                  <div className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300">
                    {administrationContent}
                  </div>
                </article>
              </div>
            </section>

            <section id="history" className="scroll-mt-24">
              <div className="border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-zinc-900 md:p-10">
                <article className="prose prose-lg max-w-none dark:prose-invert">
                  <h2 className="mb-6 font-heading text-2xl font-bold text-primary">{historyTitle}</h2>
                  <div className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300">
                    {historyContent}
                  </div>
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
                          {localizedItemText(building.name, locale)}
                        </h3>
                        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                          {localizedItemText(building.description, locale)}
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
                  <div className="whitespace-pre-wrap border-l-4 border-gray-200 pl-6 leading-relaxed text-gray-600 dark:border-gray-700 dark:text-gray-300">
                    {sanghaCurrentWork}
                  </div>
                </article>

                <div className="not-prose mt-12 grid grid-cols-1 gap-6 border-t border-gray-100 pt-12 sm:grid-cols-2 md:grid-cols-3 dark:border-gray-800">
                  {activeMonks.map((monk) => (
                    <div
                      key={monk.id}
                      className="group overflow-hidden rounded-2xl border border-gray-100 bg-zinc-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border-gray-800 dark:bg-zinc-800/50 dark:hover:shadow-black/20"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <Image
                          src={monk.image}
                          alt={localizedItemText(monk.name, locale)}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-0 left-0 w-full p-5 text-white">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary-200 opacity-90">
                            {localizedItemText(monk.title, locale)}
                          </p>
                          <h3 className="text-base font-bold leading-tight">{localizedItemText(monk.name, locale)}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

function pickSection(sections: ContentSection[] | undefined, keys: string[], type?: string) {
  if (!sections?.length) return null;
  return sections.find((section) => keys.includes(section.section_key) || (type ? section.section_type === type : false)) ?? null;
}

function sectionText(section: ContentSection | null, path: string, locale: string) {
  if (!section) return '';
  const value = getPathValue(section, path);
  if (!value) return '';
  if (typeof value === 'string') return value;
  return getLocalizedText(value as Record<string, string>, locale);
}

function getPathValue(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, source);
}

function getBuildingItems(section: ContentSection | null) {
  const items = getPathValue(section, 'body.items');
  if (!Array.isArray(items) || !items.length) return null;
  return items as Array<{ name: Record<string, string>; description: Record<string, string> }>;
}

function localizedItemText(value: unknown, locale: string) {
  if (!value || typeof value !== 'object') return '';
  return getLocalizedText(value as Record<string, string>, locale);
}
