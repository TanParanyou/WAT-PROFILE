"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/public/states/EmptyState";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { SiteModal } from "@/components/public/modal/SiteModal";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { toCommunityApiError } from "../api";
import { useCommunityActivityQuery, useDeleteCommunityQuestion } from "../queries";
import type { CommunityLocale, CommunityMemberQuestion } from "../types";
import { Edit3, Plus, Trash2 } from "lucide-react";

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
  const [deletingQuestion, setDeletingQuestion] = useState<CommunityMemberQuestion | null>(null);

  if (session.status !== "authenticated") {
    return (
      <div className="min-h-screen bg-site-canvas pt-[76px] sm:pt-[88px]">
        <PageContainer width="content">
          <div className="border-y border-site-border py-12">
            <h2 className="font-heading text-2xl font-medium text-site-foreground">{t("signInToViewActivity")}</h2>
            <Link
              href="/account/login"
              className="mt-6 inline-flex min-h-11 items-center border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action"
            >
              {t("signIn")}
            </Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  const confirmDelete = async () => {
    if (!deletingQuestion) return;
    setError("");
    try {
      await deleteMutation.mutateAsync({ id: deletingQuestion.id, version: deletingQuestion.version });
      setDeletingQuestion(null);
    } catch (deleteError: unknown) {
      setError(toCommunityApiError(deleteError).message);
      setDeletingQuestion(null);
    }
  };

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader variant="reading" align="left" title={t("activityTitle")} subtitle={t("activitySubtitle")} />
      <PageContainer width="content">
        {query.isLoading ? (
          <div className="space-y-4 py-6" aria-label={t("loading")}>
            <div className="h-28 animate-pulse border-y border-site-border bg-site-surface" />
            <div className="h-28 animate-pulse border-y border-site-border bg-site-surface" />
          </div>
        ) : null}

        {query.isError ? (
          <QueryErrorState
            title={t("loadErrorTitle")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => query.refetch()}
            isRetrying={query.isFetching}
          />
        ) : null}

        {error ? (
          <div className="mb-6 border border-site-danger/50 bg-site-danger/5 px-4 py-3 text-sm text-site-danger" role="alert">
            {error}
          </div>
        ) : null}

        {query.isSuccess && query.data.questions.length === 0 ? (
          <EmptyState title={t("activityEmptyTitle")} description={t("activityEmptyDescription")} />
        ) : null}

        {query.isSuccess && query.data.questions.length > 0 ? (
          <div className="divide-y divide-site-border border-y border-site-border">
            {query.data.questions.map((question) => (
              <ActivityRow
                key={question.id}
                question={question}
                locale={locale}
                onRequestDelete={() => setDeletingQuestion(question)}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-8 pb-16">
          <Link
            href="/community/ask"
            className="inline-flex min-h-11 items-center gap-2 border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          >
            <Plus size={16} aria-hidden="true" />
            <span>{t("askQuestion")}</span>
          </Link>
        </div>

        {/* Safety Confirmation Modal for Deletion */}
        <SiteModal
          open={Boolean(deletingQuestion)}
          onClose={() => setDeletingQuestion(null)}
          title={t("delete")}
          tone="danger"
          size="sm"
          busy={deleteMutation.isPending}
        >
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-relaxed text-site-body">
              {t("deleteConfirm")}
            </p>
            {deletingQuestion ? (
              <p className="font-semibold text-site-foreground border-l-2 border-site-danger pl-3 py-1 text-sm">
                {deletingQuestion.title}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-site-border pt-4">
              <button
                type="button"
                onClick={() => setDeletingQuestion(null)}
                className="min-h-11 border border-site-border bg-site-canvas px-4 text-sm font-semibold text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="min-h-11 border border-site-danger bg-site-danger px-5 text-sm font-semibold text-site-on-action hover:opacity-90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50"
              >
                {deleteMutation.isPending ? t("saving") : t("delete")}
              </button>
            </div>
          </div>
        </SiteModal>
      </PageContainer>
    </div>
  );
}

function ActivityRow({
  question,
  locale,
  onRequestDelete,
}: {
  question: CommunityMemberQuestion;
  locale: CommunityLocale;
  onRequestDelete: () => void;
}) {
  const t = useTranslations("Community");
  const href =
    question.publication_status === "published"
      ? `/community/q/${question.id}/${encodeURIComponent(question.slug)}`
      : question.publication_status === "deleted"
        ? "/community/activity"
        : `/community/q/${question.id}/${encodeURIComponent(question.slug)}/edit`;

  const isPending = question.publication_status === "pending_review";
  const isDeleted = question.publication_status === "deleted";

  return (
    <article className="py-6 transition-colors hover:bg-site-surface/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-site-muted">
            <span className="border border-site-border bg-site-surface px-2 py-0.5 text-site-foreground">
              {question.category.name[locale]}
            </span>
            <span
              className={`border px-2 py-0.5 ${
                isPending
                  ? "border-site-accent/60 bg-site-surface text-site-accent"
                  : isDeleted
                    ? "border-site-danger/50 text-site-danger"
                    : "border-site-border bg-site-canvas text-site-foreground"
              }`}
            >
              {t(isPending ? "pendingReview" : question.publication_status)}
            </span>
          </div>

          <h2 className="mt-2.5 font-heading text-xl font-medium leading-snug sm:text-2xl">
            <Link
              href={href}
              className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-site-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
            >
              {question.title}
            </Link>
          </h2>

          <p className="mt-2 text-xs text-site-muted">
            {t("activityUpdated", {
              date: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "Europe/Berlin" }).format(
                new Date(question.updated_at),
              ),
            })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:pt-1">
          <Link
            href={`/community/q/${question.id}/${encodeURIComponent(question.slug)}/edit`}
            className="inline-flex min-h-10 items-center gap-1.5 border border-site-border bg-site-canvas px-3.5 py-2 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          >
            <Edit3 size={13} aria-hidden="true" />
            <span>{t("edit")}</span>
          </Link>
          {!isDeleted ? (
            <button
              type="button"
              onClick={onRequestDelete}
              className="inline-flex min-h-10 items-center gap-1.5 border border-site-border/60 bg-site-canvas px-3.5 py-2 text-xs font-semibold text-site-danger transition-colors hover:bg-site-danger/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
            >
              <Trash2 size={13} aria-hidden="true" />
              <span>{t("delete")}</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
