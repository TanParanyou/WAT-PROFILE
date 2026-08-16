"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { toCommunityApiError } from "../api";
import { useCommunityActivityQuery, useDeleteCommunityQuestion } from "../queries";
import type { CommunityLocale, CommunityMemberQuestion } from "../types";

function supportedLocale(value: string): CommunityLocale {
  return value === "en" || value === "de" ? value : "th";
}

export function CommunityActivity() {
  const t = useTranslations("Community");
  const session = useAccountSession();
  const locale = supportedLocale(session.account?.preferred_locale ?? "th");
  const query = useCommunityActivityQuery(session.status === "authenticated");
  const deleteMutation = useDeleteCommunityQuestion();
  const [error, setError] = useState("");

  if (session.status !== "authenticated") {
    return <PageContainer width="content"><div className="border-y border-site-border py-12"><h2 className="font-heading text-2xl font-medium">{t("signInToViewActivity")}</h2><Link href="/account/login" className="mt-6 inline-flex min-h-11 items-center border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action">{t("signIn")}</Link></div></PageContainer>;
  }

  const remove = async (question: CommunityMemberQuestion) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setError("");
    try {
      await deleteMutation.mutateAsync({ id: question.id, version: question.version });
    } catch (deleteError: unknown) {
      setError(toCommunityApiError(deleteError).message);
    }
  };

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="reading" align="left" title={t("activityTitle")} subtitle={t("activitySubtitle")} />
      <PageContainer width="content">
        {query.isLoading ? <div className="h-56 animate-pulse border-y border-site-border bg-site-surface" aria-label={t("loading")} /> : null}
        {query.isError ? <QueryErrorState title={t("loadErrorTitle")} description={t("loadErrorDescription")} retryLabel={t("retry")} onRetry={() => query.refetch()} isRetrying={query.isFetching} /> : null}
        {error ? <div className="mb-6 border border-site-danger/50 bg-site-danger/5 px-4 py-3 text-sm text-site-danger" role="alert">{error}</div> : null}
        {query.isSuccess && query.data.questions.length === 0 ? <EmptyState title={t("activityEmptyTitle")} description={t("activityEmptyDescription")} /> : null}
        {query.isSuccess && query.data.questions.length > 0 ? <div className="border-t border-site-border">{query.data.questions.map((question) => <ActivityRow key={question.id} question={question} locale={locale} onDelete={() => remove(question)} />)}</div> : null}
        <Link href="/community/ask" className="mt-8 inline-flex min-h-11 items-center border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action hover:bg-site-action-hover">{t("askQuestion")}</Link>
      </PageContainer>
    </div>
  );
}

function ActivityRow({ question, locale, onDelete }: { question: CommunityMemberQuestion; locale: CommunityLocale; onDelete: () => void }) {
  const t = useTranslations("Community");
  const href = question.publication_status === "published" ? `/community/q/${question.id}/${encodeURIComponent(question.slug)}` : question.publication_status === "deleted" ? "/community/activity" : `/community/q/${question.id}/${encodeURIComponent(question.slug)}/edit`;
  return <article className="border-b border-site-border py-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-site-muted">{question.category.name[locale]} · {t(question.publication_status === "pending_review" ? "pendingReview" : question.publication_status)}</p><h2 className="mt-2 font-heading text-2xl font-medium"><Link href={href} className="underline decoration-transparent underline-offset-4 hover:decoration-site-border">{question.title}</Link></h2><p className="mt-2 text-sm text-site-muted">{t("activityUpdated", { date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Europe/Berlin" }).format(new Date(question.updated_at)) })}</p></div><div className="flex shrink-0 gap-3"><Link href={`/community/q/${question.id}/${encodeURIComponent(question.slug)}/edit`} className="min-h-10 px-3 py-2 text-sm font-semibold underline underline-offset-4">{t("edit")}</Link>{question.publication_status !== "deleted" ? <button type="button" onClick={onDelete} className="min-h-10 px-3 py-2 text-sm font-semibold text-site-danger underline underline-offset-4">{t("delete")}</button> : null}</div></div></article>;
}
