"use client";

import { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { QuestionList } from "./QuestionList";
import { useCommunityCategoriesQuery, useCommunityQuestionsQuery } from "../queries";
import type { CommunityLocale, CommunityQuestionListOptions } from "../types";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";

function supportedLocale(value: string): CommunityLocale {
  return value === "en" || value === "de" ? value : "th";
}

export function CommunityContent({ categoryID }: { categoryID?: string }) {
  const locale = supportedLocale(useLocale());
  const t = useTranslations("Community");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const session = useAccountSession();
  const categoriesQuery = useCommunityCategoriesQuery();
  const options: CommunityQuestionListOptions = {
    category_id: categoryID ?? searchParams.get("category_id") ?? undefined,
    locale: (searchParams.get("locale") as CommunityQuestionListOptions["locale"]) ?? locale,
    lifecycle: (searchParams.get("lifecycle") as CommunityQuestionListOptions["lifecycle"]) ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };
  const questionsQuery = useCommunityQuestionsQuery(options);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateFilter("search", String(form.get("search") ?? "").trim());
  };

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="reading" align="left" title={t("title")} subtitle={t("subtitle")} />
      <PageContainer width="content">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-site-border pb-6">
          <p className="max-w-xl text-sm leading-7 text-site-body">{t("memberPrompt")}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/community/ask" className="inline-flex min-h-11 items-center border border-site-border bg-site-action px-4 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">{t("askQuestion")}</Link>
            {session.status === "authenticated" ? <Link href="/community/activity" className="inline-flex min-h-11 items-center border border-site-border px-4 text-sm font-semibold text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">{t("myActivity")}</Link> : null}
          </div>
        </div>
        <section aria-labelledby="community-filter-heading">
          <h2 id="community-filter-heading" className="sr-only">{t("title")}</h2>
          <div className="grid gap-3 border-y border-site-border py-5 md:grid-cols-[minmax(0,1fr)_auto_auto]">
            <form onSubmit={submitSearch} className="flex min-h-11 gap-2">
              <label htmlFor="community-search" className="sr-only">{t("search")}</label>
              <input id="community-search" name="search" defaultValue={options.search} placeholder={t("searchPlaceholder")} className="min-w-0 flex-1 border border-site-border bg-site-canvas px-3 text-sm text-site-foreground outline-none focus-visible:border-site-focus focus-visible:ring-2 focus-visible:ring-site-focus/30" />
              <button type="submit" className="min-h-11 border border-site-border bg-site-action px-4 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">{t("search")}</button>
            </form>
            <label className="flex min-h-11 items-center gap-2 border border-site-border px-3 text-sm text-site-body">
              <span className="sr-only">{t("category")}</span>
              <select value={options.category_id ?? ""} onChange={(event) => updateFilter("category_id", event.target.value)} className="min-h-9 bg-transparent text-site-foreground outline-none">
                <option value="">{t("allCategories")}</option>
                {categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{category.name[locale]}</option>)}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2 border border-site-border px-3 text-sm text-site-body">
              <span className="sr-only">{t("language")}</span>
              <select value={options.locale ?? locale} onChange={(event) => updateFilter("locale", event.target.value)} className="min-h-9 bg-transparent text-site-foreground outline-none">
                <option value="all">{t("allLanguages")}</option>
                <option value="th">ไทย</option><option value="en">English</option><option value="de">Deutsch</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mt-10" aria-live="polite">
          {questionsQuery.isLoading ? <div className="space-y-5" aria-label={t("loading")}><div className="h-28 animate-pulse border-y border-site-border bg-site-surface" /><div className="h-28 animate-pulse border-y border-site-border bg-site-surface" /></div> : null}
          {questionsQuery.isError ? <QueryErrorState title={t("loadErrorTitle")} description={t("loadErrorDescription")} retryLabel={t("retry")} onRetry={() => questionsQuery.refetch()} isRetrying={questionsQuery.isFetching} /> : null}
          {questionsQuery.isSuccess && questionsQuery.data.items.length === 0 ? <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} /> : null}
          {questionsQuery.isSuccess && questionsQuery.data.items.length > 0 ? <QuestionList items={questionsQuery.data.items} locale={locale} answerLabel={(count) => t("answers", { count })} activityLabel={(date) => t("latestActivity", { date })} statusLabel={(status) => t(status)} /> : null}
        </section>
      </PageContainer>
    </div>
  );
}
