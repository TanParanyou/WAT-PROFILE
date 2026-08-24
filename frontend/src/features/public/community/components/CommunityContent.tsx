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
import { ChevronDown, Plus, Search, User } from "lucide-react";

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

  const currentLifecycle = (searchParams.get("lifecycle") as CommunityQuestionListOptions["lifecycle"]) ?? undefined;

  const options: CommunityQuestionListOptions = {
    category_id: categoryID ?? searchParams.get("category_id") ?? undefined,
    locale: (searchParams.get("locale") as CommunityQuestionListOptions["locale"]) ?? locale,
    lifecycle: currentLifecycle,
    search: searchParams.get("search") ?? undefined,
  };
  const questionsQuery = useCommunityQuestionsQuery(options);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCategoryChange = (selectedID: string) => {
    if (categoryID) {
      // If currently on /community/category/[slug], route cleanly
      if (!selectedID) {
        router.push("/community");
      } else {
        const found = categoriesQuery.data?.find((c) => c.id === selectedID);
        if (found) {
          router.push(`/community/category/${found.slug}`);
        } else {
          router.push(`/community?category_id=${selectedID}`);
        }
      }
    } else {
      updateFilter("category_id", selectedID);
    }
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
        {/* Top Banner / Actions Bar */}
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-site-border pb-8 sm:flex-row sm:items-center">
          <p className="max-w-xl text-sm leading-relaxed text-site-body">{t("memberPrompt")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/community/ask"
              className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
            >
              <Plus size={16} aria-hidden="true" />
              <span>{t("askQuestion")}</span>
            </Link>
            {session.status === "authenticated" ? (
              <Link
                href="/community/activity"
                className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-canvas px-4 text-sm font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
              >
                <User size={15} aria-hidden="true" />
                <span>{t("myActivity")}</span>
              </Link>
            ) : null}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <section aria-labelledby="community-filter-heading" className="space-y-4">
          <h2 id="community-filter-heading" className="sr-only">
            {t("title")}
          </h2>

          <div className="grid gap-3 border-y border-site-border py-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            {/* Search Input */}
            <form onSubmit={submitSearch} className="flex min-h-11 gap-2">
              <label htmlFor="community-search" className="sr-only">
                {t("search")}
              </label>
              <div className="relative min-w-0 flex-1">
                <input
                  id="community-search"
                  name="search"
                  defaultValue={options.search}
                  placeholder={t("searchPlaceholder")}
                  className="min-h-11 w-full border border-site-border bg-site-canvas pl-3.5 pr-4 text-sm text-site-foreground outline-none transition-colors focus-visible:border-site-focus focus-visible:ring-2 focus-visible:ring-site-focus/30"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
              >
                <Search size={15} aria-hidden="true" />
                <span>{t("search")}</span>
              </button>
            </form>

            {/* Category Dropdown */}
            <div className="relative min-h-11">
              <label htmlFor="community-category-filter" className="sr-only">
                {t("category")}
              </label>
              <select
                id="community-category-filter"
                value={options.category_id ?? ""}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="min-h-11 w-full appearance-none border border-site-border bg-site-canvas px-4 pr-10 text-sm font-medium text-site-foreground outline-none transition-colors hover:bg-site-surface/50 focus-visible:border-site-focus focus-visible:ring-2 focus-visible:ring-site-focus/30"
              >
                <option value="">{t("allCategories")}</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name[locale] || category.name.th || category.name.en || category.name.de || category.slug}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-site-muted"
                aria-hidden="true"
              />
            </div>

            {/* Language Dropdown */}
            <div className="relative min-h-11">
              <label htmlFor="community-locale-filter" className="sr-only">
                {t("language")}
              </label>
              <select
                id="community-locale-filter"
                value={options.locale ?? locale}
                onChange={(event) => updateFilter("locale", event.target.value)}
                className="min-h-11 w-full appearance-none border border-site-border bg-site-canvas px-4 pr-10 text-sm font-medium text-site-foreground outline-none transition-colors hover:bg-site-surface/50 focus-visible:border-site-focus focus-visible:ring-2 focus-visible:ring-site-focus/30"
              >
                <option value="all">{t("allLanguages")}</option>
                <option value="th">ไทย</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-site-muted"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Status / Lifecycle Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-site-muted mr-1">{t("allLifecycles")}:</span>
            {[
              { id: "", label: t("allLifecycles") },
              { id: "open", label: t("open") },
              { id: "answered", label: t("answered") },
              { id: "resolved", label: t("resolved") },
            ].map((tab) => {
              const active = (!currentLifecycle && tab.id === "") || currentLifecycle === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => updateFilter("lifecycle", tab.id)}
                  aria-pressed={active}
                  className={`min-h-8 border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-site-focus ${
                    active
                      ? "border-site-border bg-site-action text-site-on-action"
                      : "border-site-border/60 bg-site-canvas text-site-body hover:bg-site-surface"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Questions List Section */}
        <section className="mt-8 pb-16" aria-live="polite">
          {questionsQuery.isLoading ? (
            <div className="space-y-4" aria-label={t("loading")}>
              <div className="h-24 animate-pulse border-y border-site-border bg-site-surface" />
              <div className="h-24 animate-pulse border-y border-site-border bg-site-surface" />
              <div className="h-24 animate-pulse border-y border-site-border bg-site-surface" />
            </div>
          ) : null}

          {questionsQuery.isError ? (
            <QueryErrorState
              title={t("loadErrorTitle")}
              description={t("loadErrorDescription")}
              retryLabel={t("retry")}
              onRetry={() => questionsQuery.refetch()}
              isRetrying={questionsQuery.isFetching}
            />
          ) : null}

          {questionsQuery.isSuccess && questionsQuery.data.items.length === 0 ? (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : null}

          {questionsQuery.isSuccess && questionsQuery.data.items.length > 0 ? (
            <QuestionList
              items={questionsQuery.data.items}
              locale={locale}
              answerLabel={(count) => t("answers", { count })}
              activityLabel={(date) => t("latestActivity", { date })}
              statusLabel={(status) => t(status)}
            />
          ) : null}
        </section>
      </PageContainer>
    </div>
  );
}
