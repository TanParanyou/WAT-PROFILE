"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageContainer from "@/components/layout/PageContainer";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { emptyRichTextDocument } from "@/lib/rich-text/document";
import { toCommunityApiError } from "../api";
import {
  useAcceptCommunityAnswer,
  useCommunityQuestionQuery,
  useCommunityViewerQuery,
  useCreateCommunityAnswer,
  useCreateCommunityComment,
} from "../queries";
import type { CommunityAnswer, CommunityComment, CommunityLocale } from "../types";
import { ArrowLeft, Check, Edit3, MessageSquare, ShieldCheck, User } from "lucide-react";
import { formatDateTimeWithRelative } from "@/utils/formatters";
import { CommunityRichTextEditor } from "./CommunityRichTextEditor";
import { HelpfulButton } from "./HelpfulButton";
import { ReportDialog } from "./ReportDialog";

function supportedLocale(value: string): CommunityLocale {
  return value === "en" || value === "de" ? value : "th";
}

export function QuestionDetailContent({ id }: { id: string }) {
  const locale = supportedLocale(useLocale());
  const t = useTranslations("Community");
  const session = useAccountSession();
  const query = useCommunityQuestionQuery(id);
  const viewerQuery = useCommunityViewerQuery(id, session.status === "authenticated");
  const acceptMutation = useAcceptCommunityAnswer();
  const [actionError, setActionError] = useState("");
  const [showQuestionComments, setShowQuestionComments] = useState(false);
  const [isWritingQuestionComment, setIsWritingQuestionComment] = useState(false);

  if (query.isLoading) {
    return (
      <PageContainer width="reading">
        <div className="my-6 space-y-4 animate-pulse px-1" aria-label={t("loading")}>
          <div className="h-5 w-28 bg-site-surface" />
          <div className="h-10 w-4/5 bg-site-surface" />
          <div className="h-40 bg-site-surface" />
        </div>
      </PageContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageContainer width="reading">
        <div className="my-8 px-1">
          <QueryErrorState
            title={t("questionNotFound")}
            description={t("loadErrorDescription")}
            retryLabel={t("retry")}
            onRetry={() => query.refetch()}
            isRetrying={query.isFetching}
          />
        </div>
      </PageContainer>
    );
  }

  const detail = query.data;
  const date = formatDateTimeWithRelative(detail.last_activity_at, locale);
  const canContribute =
    session.status === "authenticated" && !["locked", "archived"].includes(detail.question.lifecycle_status);

  const questionComments = detail.comments.filter((comment) => !comment.answer_id);

  const accept = async (answerID: string) => {
    setActionError("");
    try {
      await acceptMutation.mutateAsync({ answerID, expectedVersion: detail.version });
    } catch (error: unknown) {
      setActionError(toCommunityApiError(error).message);
    }
  };

  return (
    <div className="min-h-screen bg-site-canvas pt-[76px] sm:pt-[88px] pb-10 sm:pb-16">
      <PageContainer width="reading" className="!pt-2 sm:!pt-4">
        {/* Back Link */}
        <div className="pb-3 px-1 sm:px-0">
          <Link
            href="/community"
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-site-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-site-foreground hover:decoration-site-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          >
            <ArrowLeft size={16} />
            <span>{t("backToCommunity")}</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* QUESTION CARD */}
        {/* ========================================================================= */}
        <article className="border border-site-border bg-site-surface/30 p-4 sm:p-6 md:p-8" aria-label={detail.question.title}>
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-site-muted">
            <Link
              href={`/community/category/${detail.question.category.slug}`}
              className="border border-site-border bg-site-surface px-2.5 py-1 text-site-foreground hover:bg-site-surface/80 transition-colors"
            >
              {detail.question.category.name[locale]}
            </Link>
            <span className="border border-site-border bg-site-surface px-2 py-1">{detail.question.locale.toUpperCase()}</span>
            <span
              className={`border px-2 py-1 ${
                detail.question.lifecycle_status === "resolved"
                  ? "border-site-border bg-site-action text-site-on-action"
                  : detail.question.lifecycle_status === "answered"
                    ? "border-site-border bg-site-surface text-site-foreground"
                    : "border-site-border bg-site-surface text-site-body"
              }`}
            >
              {t(detail.question.lifecycle_status)}
            </span>
          </div>

          {/* Question Title */}
          <h1 className="mt-4 sm:mt-5 font-heading text-xl sm:text-2xl md:text-3xl font-medium leading-snug text-site-foreground break-words">
            {detail.question.title}
          </h1>

          {/* Author & Timestamp Bar */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-site-border/70 pb-4 text-xs sm:text-sm text-site-muted">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="inline-flex items-center gap-2">
                {detail.question.author?.avatar_url ? (
                  <img
                    src={detail.question.author.avatar_url}
                    alt=""
                    className="size-6 object-cover border border-site-border"
                  />
                ) : (
                  <span className="flex size-6 items-center justify-center border border-site-border bg-site-surface text-site-muted">
                    <User size={13} />
                  </span>
                )}
                <span className="font-medium text-site-foreground">
                  {detail.question.author?.display_name ?? t("anonymousAuthor")}
                </span>
              </div>
              <span aria-hidden="true" className="opacity-50">·</span>
              <span className="text-[11px] sm:text-xs">{t("latestActivity", { date })}</span>
            </div>

            {viewerQuery.data?.can_edit ? (
              <Link
                href={`/community/q/${detail.question.id}/${encodeURIComponent(detail.question.slug)}/edit`}
                className="inline-flex min-h-[36px] items-center gap-1.5 border border-site-border bg-site-surface px-3 py-1 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
              >
                <Edit3 size={13} aria-hidden="true" />
                <span>{t("edit")}</span>
              </Link>
            ) : null}
          </div>

          {/* Question Body */}
          <div className="py-5 sm:py-6 max-w-[75ch]">
            <RichTextContent
              value={detail.body}
              locale={locale}
              defaultLocale={detail.question.locale}
              className="text-sm sm:text-base leading-relaxed sm:leading-8 text-site-foreground"
            />
          </div>

          {/* Question Card Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-site-border/70 pt-3.5">
            <button
              type="button"
              onClick={() => setShowQuestionComments(!showQuestionComments)}
              className="inline-flex min-h-[44px] items-center gap-2 border border-site-border bg-site-canvas px-3.5 py-2 text-xs font-semibold text-site-foreground hover:bg-site-surface transition-colors focus-visible:outline-3 focus-visible:outline-site-focus"
            >
              <MessageSquare size={14} />
              <span>
                {questionComments.length > 0
                  ? t("questionComments", { count: questionComments.length })
                  : t("addComment")}
              </span>
            </button>

            <ReportDialog target={{ question_id: id }} enabled={session.status === "authenticated"} />
          </div>

          {/* Question Comments Accordion */}
          {showQuestionComments && (
            <div className="mt-4 space-y-3 border-t border-site-border/60 bg-site-surface/30 p-3.5 sm:p-4">
              {questionComments.length > 0 ? (
                <div className="space-y-3 divide-y divide-site-border/40">
                  {questionComments.map((comment) => (
                    <CommentRow key={comment.id} comment={comment} locale={locale} enabled={canContribute} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-site-muted italic">{t("noComments")}</p>
              )}

              {canContribute ? (
                isWritingQuestionComment ? (
                  <div className="pt-2">
                    <CommentComposer
                      questionID={id}
                      onCancel={() => setIsWritingQuestionComment(false)}
                      onSuccess={() => setIsWritingQuestionComment(false)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsWritingQuestionComment(true)}
                    className="mt-2 inline-flex min-h-[38px] items-center gap-1.5 text-xs font-semibold text-site-accent underline underline-offset-2 hover:text-site-foreground transition-colors"
                  >
                    + {t("addComment")}
                  </button>
                )
              ) : null}
            </div>
          )}
        </article>

        {actionError ? (
          <div className="mt-4 sm:mt-6 border border-site-danger/50 bg-site-danger/5 px-4 py-3 text-sm text-site-danger" role="alert">
            {actionError}
          </div>
        ) : null}

        {/* ========================================================================= */}
        {/* ANSWERS SECTION */}
        {/* ========================================================================= */}
        <section className="mt-8 sm:mt-12" aria-labelledby="answers-heading">
          <div className="flex items-center justify-between border-b border-site-border pb-3 sm:pb-4 px-1 sm:px-0">
            <h2 id="answers-heading" className="font-heading text-lg sm:text-xl md:text-2xl font-medium text-site-foreground">
              {t("answers", { count: detail.answers.length })}
            </h2>
          </div>

          {detail.answers.length === 0 ? (
            <div className="border border-site-border bg-site-surface/20 my-4 sm:my-6 py-8 sm:py-10 px-4 sm:px-6 text-center text-sm text-site-muted">
              {t("noAnswers")}
            </div>
          ) : (
            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              {detail.answers.map((answer) => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  comments={detail.comments.filter((comment) => comment.answer_id === answer.id)}
                  accepted={answer.id === detail.accepted_answer_id}
                  locale={locale}
                  canContribute={canContribute}
                  canAccept={viewerQuery.data?.can_accept === true}
                  isAccepting={acceptMutation.isPending}
                  onAccept={() => accept(answer.id)}
                  onHelpfulError={setActionError}
                />
              ))}
            </div>
          )}

          {/* Answer Composer / Call to Action */}
          <div className="mt-8 sm:mt-10">
            {canContribute ? (
              <AnswerComposer questionID={id} />
            ) : session.status !== "authenticated" ? (
              <div className="border border-site-border bg-site-surface p-5 sm:p-8 text-center">
                <h3 className="font-heading text-lg sm:text-xl font-medium text-site-foreground">{t("signInToAsk")}</h3>
                <p className="mt-2 text-xs sm:text-sm text-site-body max-w-md mx-auto">{t("signInToAskDescription")}</p>
                <Link
                  href="/account/login"
                  className="mt-5 inline-flex min-h-11 w-full sm:w-auto items-center justify-center border border-site-border bg-site-action px-6 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus transition-colors"
                >
                  {t("signIn")}
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </PageContainer>
    </div>
  );
}

function AnswerCard({
  answer,
  comments,
  accepted,
  locale,
  canContribute,
  canAccept,
  isAccepting,
  onAccept,
  onHelpfulError,
}: {
  answer: CommunityAnswer;
  comments: CommunityComment[];
  accepted: boolean;
  locale: CommunityLocale;
  canContribute: boolean;
  canAccept: boolean;
  isAccepting: boolean;
  onAccept: () => void;
  onHelpfulError: (message: string) => void;
}) {
  const t = useTranslations("Community");
  const [showComments, setShowComments] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const answerDate = formatDateTimeWithRelative(
    answer.published_at || answer.created_at,
    locale,
  );

  return (
    <article
      className={`border transition-colors p-4 sm:p-6 md:p-7 ${
        accepted
          ? "border-site-accent/80 bg-site-surface/40"
          : answer.is_official
            ? "border-site-accent/50 bg-site-surface/20"
            : "border-site-border bg-site-canvas"
      }`}
    >
      {/* Answer Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-site-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="inline-flex items-center gap-2">
            {answer.author?.avatar_url ? (
              <img
                src={answer.author.avatar_url}
                alt=""
                className="size-6 object-cover border border-site-border"
              />
            ) : (
              <span className="flex size-6 items-center justify-center border border-site-border bg-site-surface text-site-muted">
                <User size={13} />
              </span>
            )}
            <span className="text-xs sm:text-sm font-medium text-site-foreground">
              {answer.author?.display_name ?? t("anonymousAuthor")}
            </span>
          </div>

          {answer.is_official && (
            <span className="inline-flex items-center gap-1.5 border border-site-accent/60 bg-site-surface px-2 py-0.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-site-accent">
              <ShieldCheck size={13} />
              {t("official")}
            </span>
          )}

          {accepted && (
            <span className="inline-flex items-center gap-1.5 border border-site-border bg-site-action px-2 py-0.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-site-on-action">
              <Check size={13} />
              {t("accepted")}
            </span>
          )}
        </div>

        <span className="text-[11px] sm:text-xs text-site-muted">{answerDate}</span>
      </div>

      {/* Answer Body */}
      <div className="py-4 sm:py-5 max-w-[75ch]">
        <RichTextContent
          value={answer.body}
          locale={locale}
          defaultLocale={locale}
          className="text-sm sm:text-base leading-relaxed sm:leading-8 text-site-foreground"
        />
      </div>

      {/* Answer Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-site-border/60 pt-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <HelpfulButton
            answerID={answer.id}
            initialCount={answer.helpful_count}
            enabled={canContribute}
            onError={onHelpfulError}
          />

          {canAccept && !accepted && (
            <button
              type="button"
              disabled={isAccepting}
              onClick={onAccept}
              className="inline-flex min-h-[44px] items-center gap-1.5 border border-site-border bg-site-canvas px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50 transition-colors"
            >
              <Check size={15} />
              <span>{isAccepting ? t("saving") : t("acceptAnswer")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="inline-flex min-h-[44px] items-center gap-1.5 border border-site-border bg-site-canvas px-3 sm:px-3.5 py-2 text-xs font-semibold text-site-muted hover:text-site-foreground hover:bg-site-surface transition-colors focus-visible:outline-3 focus-visible:outline-site-focus"
          >
            <MessageSquare size={14} />
            <span>
              {comments.length > 0
                ? `${t("comments")} (${comments.length})`
                : t("addComment")}
            </span>
          </button>
        </div>

        <ReportDialog target={{ answer_id: answer.id }} enabled={canContribute} />
      </div>

      {/* Nested Answer Comments */}
      {showComments && (
        <div className="mt-3.5 border-t border-site-border/60 pt-3.5 space-y-3 bg-site-surface/30 p-3 sm:p-4">
          {comments.length > 0 ? (
            <div className="space-y-3 divide-y divide-site-border/40">
              {comments.map((comment) => (
                <CommentRow key={comment.id} comment={comment} locale={locale} enabled={canContribute} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-site-muted italic">{t("noComments")}</p>
          )}

          {canContribute ? (
            isReplying ? (
              <div className="pt-2">
                <CommentComposer
                  questionID={answer.question_id}
                  answerID={answer.id}
                  onCancel={() => setIsReplying(false)}
                  onSuccess={() => setIsReplying(false)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsReplying(true)}
                className="mt-2 inline-flex min-h-[38px] items-center gap-1.5 text-xs font-semibold text-site-accent underline underline-offset-2 hover:text-site-foreground transition-colors"
              >
                + {t("addComment")}
              </button>
            )
          ) : null}
        </div>
      )}
    </article>
  );
}

function CommentRow({
  comment,
  locale,
  enabled,
}: {
  comment: CommunityComment;
  locale: CommunityLocale;
  enabled: boolean;
}) {
  const t = useTranslations("Community");
  const commentDate = formatDateTimeWithRelative(comment.created_at, locale);

  return (
    <div className="pt-3 first:pt-0">
      <div className="flex items-center justify-between gap-2 text-xs text-site-muted">
        <div className="inline-flex items-center gap-1.5 font-medium text-site-foreground">
          {comment.author?.avatar_url ? (
            <img
              src={comment.author.avatar_url}
              alt=""
              className="size-4 object-cover border border-site-border"
            />
          ) : (
            <User size={12} className="text-site-muted" />
          )}
          <span>{comment.author?.display_name ?? t("anonymousAuthor")}</span>
        </div>
        <span className="text-[11px]">{commentDate}</span>
      </div>

      <RichTextContent
        value={comment.body}
        locale={locale}
        defaultLocale={locale}
        className="mt-1 text-xs sm:text-sm leading-relaxed text-site-body max-w-[70ch]"
      />

      <div className="mt-1">
        <ReportDialog target={{ comment_id: comment.id }} enabled={enabled} />
      </div>
    </div>
  );
}

function AnswerComposer({ questionID }: { questionID: string }) {
  const t = useTranslations("Community");
  const mutation = useCreateCommunityAnswer();
  const [body, setBody] = useState(emptyRichTextDocument());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    try {
      const result = await mutation.mutateAsync({ questionID, input: { body }, idempotencyKey: crypto.randomUUID() });
      setBody(emptyRichTextDocument());
      setSuccess(true);
      if (result.review_required) setError(t("reviewNotice"));
    } catch (submitError: unknown) {
      setError(toCommunityApiError(submitError).message);
    }
  };

  return (
    <form onSubmit={submit} className="border border-site-border bg-site-canvas p-4 sm:p-6 md:p-8">
      <h3 className="font-heading text-lg sm:text-xl md:text-2xl font-medium text-site-foreground">{t("answerQuestion")}</h3>
      <p className="mt-1 text-xs sm:text-sm text-site-muted">{t("answerPlaceholder")}</p>
      
      <div className="mt-3 sm:mt-4">
        <CommunityRichTextEditor
          value={body}
          onChange={setBody}
          placeholder={t("answerPlaceholder")}
          error={error}
          disabled={mutation.isPending}
        />
      </div>

      <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-11 w-full sm:w-auto inline-flex items-center justify-center border border-site-border bg-site-action px-6 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? t("saving") : t("submitAnswer")}
        </button>
        {success && !error ? (
          <span className="text-xs sm:text-sm text-site-accent" role="status">
            {t("submitAnswerSuccess")}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function CommentComposer({
  questionID,
  answerID,
  onCancel,
  onSuccess,
}: {
  questionID: string;
  answerID?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Community");
  const mutation = useCreateCommunityComment();
  const [body, setBody] = useState(emptyRichTextDocument());
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const result = await mutation.mutateAsync({
        questionID,
        input: { ...(answerID ? { answer_id: answerID } : {}), body },
        idempotencyKey: crypto.randomUUID(),
      });
      setBody(emptyRichTextDocument());
      if (result.review_required) setError(t("reviewNotice"));
      onSuccess?.();
    } catch (submitError: unknown) {
      setError(toCommunityApiError(submitError).message);
    }
  };

  return (
    <form onSubmit={submit} className="border border-site-border/80 bg-site-canvas p-3 sm:p-4">
      <div className="flex items-center justify-between text-xs font-semibold text-site-muted mb-2">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={13} />
          <span>{t("submitComment")}</span>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[32px] px-2 text-site-muted hover:text-site-foreground text-xs"
          >
            {t("cancelComment")}
          </button>
        )}
      </div>

      <div>
        <CommunityRichTextEditor
          value={body}
          onChange={setBody}
          placeholder={t("commentPlaceholder")}
          error={error}
          disabled={mutation.isPending}
          compact={true}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex min-h-10 items-center justify-center border border-site-border bg-site-action px-4 py-2 text-xs font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? t("saving") : t("submitComment")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center justify-center border border-site-border bg-site-canvas px-3 py-2 text-xs font-semibold text-site-muted hover:text-site-foreground hover:bg-site-surface transition-colors"
          >
            {t("cancelComment")}
          </button>
        )}
      </div>
    </form>
  );
}
