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

  if (query.isLoading) {
    return (
      <PageContainer width="reading">
        <div className="my-8 space-y-6 animate-pulse" aria-label={t("loading")}>
          <div className="h-6 w-32 bg-site-surface" />
          <div className="h-12 w-3/4 bg-site-surface" />
          <div className="h-48 bg-site-surface" />
        </div>
      </PageContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PageContainer width="reading">
        <div className="my-10">
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
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Berlin" }).format(
    new Date(detail.last_activity_at),
  );
  const canContribute =
    session.status === "authenticated" && !["locked", "archived"].includes(detail.question.lifecycle_status);

  const accept = async (answerID: string) => {
    setActionError("");
    try {
      await acceptMutation.mutateAsync({ answerID, expectedVersion: detail.version });
    } catch (error: unknown) {
      setActionError(toCommunityApiError(error).message);
    }
  };

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageContainer width="reading">
        <div className="pt-6 pb-2">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm font-semibold text-site-muted underline decoration-transparent underline-offset-4 transition-colors hover:text-site-foreground hover:decoration-site-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          >
            <ArrowLeft size={16} />
            <span>{t("backToCommunity")}</span>
          </Link>
        </div>

        {/* Question Header */}
        <header className="mt-6 border-b border-site-border pb-8">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-site-muted">
            <Link
              href={`/community/category/${detail.question.category.slug}`}
              className="border border-site-border bg-site-surface px-2.5 py-1 text-site-foreground hover:bg-site-surface/80"
            >
              {detail.question.category.name[locale]}
            </Link>
            <span className="border border-site-border px-2.5 py-1">{detail.question.locale.toUpperCase()}</span>
            <span
              className={`border px-2.5 py-1 ${
                detail.question.lifecycle_status === "resolved"
                  ? "border-site-border bg-site-action text-site-on-action"
                  : detail.question.lifecycle_status === "answered"
                    ? "border-site-border bg-site-surface text-site-foreground"
                    : "border-site-border text-site-body"
              }`}
            >
              {t(detail.question.lifecycle_status)}
            </span>
          </div>

          <h1 className="mt-5 font-heading text-3xl font-medium leading-tight text-site-foreground sm:text-4xl lg:text-[2.5rem]">
            {detail.question.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-site-muted">
            <div className="flex flex-wrap items-center gap-3">
              <span>{t("latestActivity", { date })}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <User size={14} />
                {detail.question.author?.display_name ?? t("anonymousAuthor")}
              </span>
            </div>
            {viewerQuery.data?.can_edit ? (
              <Link
                href={`/community/q/${detail.question.id}/${encodeURIComponent(detail.question.slug)}/edit`}
                className="inline-flex min-h-9 items-center gap-1.5 border border-site-border bg-site-surface px-3 py-1.5 text-xs font-semibold text-site-foreground transition-colors hover:bg-site-canvas focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
              >
                <Edit3 size={13} aria-hidden="true" />
                <span>{t("edit")}</span>
              </Link>
            ) : null}
          </div>
        </header>

        {/* Question Body */}
        <article className="border-b border-site-border py-8" aria-label={detail.question.title}>
          <RichTextContent
            value={detail.body}
            locale={locale}
            defaultLocale={detail.question.locale}
            className="leading-8 text-site-foreground"
          />
          <ReportDialog target={{ question_id: id }} enabled={session.status === "authenticated"} />
        </article>

        {actionError ? (
          <div className="mt-6 border border-site-danger/50 bg-site-danger/5 px-4 py-3 text-sm text-site-danger" role="alert">
            {actionError}
          </div>
        ) : null}

        {/* Answers Section */}
        <section className="mt-12" aria-labelledby="answers-heading">
          <div className="flex items-center justify-between border-b border-site-border pb-4">
            <h2 id="answers-heading" className="font-heading text-2xl font-medium text-site-foreground sm:text-3xl">
              {t("answers", { count: detail.answers.length })}
            </h2>
          </div>

          {detail.answers.length === 0 ? (
            <div className="border-b border-site-border py-10 text-center text-sm text-site-muted">
              {t("noAnswers")}
            </div>
          ) : (
            <div className="divide-y divide-site-border border-b border-site-border">
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

          {canContribute ? (
            <AnswerComposer questionID={id} />
          ) : session.status !== "authenticated" ? (
            <div className="mt-8 border border-site-border bg-site-surface p-6 text-center">
              <h3 className="font-heading text-xl font-medium text-site-foreground">{t("signInToAsk")}</h3>
              <p className="mt-2 text-sm text-site-body">{t("signInToAskDescription")}</p>
              <Link
                href="/account/login"
                className="mt-5 inline-flex min-h-11 items-center border border-site-border bg-site-action px-6 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
              >
                {t("signIn")}
              </Link>
            </div>
          ) : null}
        </section>

        {/* Question-level Comments Section */}
        <section className="mt-12 pb-16" aria-labelledby="comments-heading">
          <div className="border-b border-site-border pb-3">
            <h2 id="comments-heading" className="font-heading text-xl font-medium text-site-foreground sm:text-2xl">
              {t("comments")}
            </h2>
          </div>

          {detail.comments.filter((comment) => !comment.answer_id).length > 0 ? (
            <div className="mt-5 space-y-4">
              {detail.comments
                .filter((comment) => !comment.answer_id)
                .map((comment) => (
                  <CommentRow key={comment.id} comment={comment} locale={locale} enabled={canContribute} />
                ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-site-muted">{t("noComments")}</p>
          )}

          {canContribute ? <CommentComposer questionID={id} /> : null}
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

  return (
    <article
      className={`py-8 transition-colors ${
        answer.is_official ? "border-l-4 border-site-accent bg-site-surface/40 px-5 sm:px-6" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
        {answer.is_official ? (
          <span className="inline-flex items-center gap-1.5 border border-site-accent/60 bg-site-surface px-2.5 py-1 text-site-accent">
            <ShieldCheck size={14} />
            {t("official")}
          </span>
        ) : null}
        {accepted ? (
          <span className="inline-flex items-center gap-1.5 border border-site-border bg-site-action px-2.5 py-1 text-site-on-action">
            <Check size={14} />
            {t("accepted")}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1.5 text-site-muted">
          <User size={13} />
          {answer.author?.display_name ?? t("anonymousAuthor")}
        </span>
      </div>

      <RichTextContent
        value={answer.body}
        locale={locale}
        defaultLocale={locale}
        className="mt-5 leading-8 text-site-foreground"
      />

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <HelpfulButton
          answerID={answer.id}
          initialCount={answer.helpful_count}
          enabled={canContribute}
          onError={onHelpfulError}
        />
        {canAccept && !accepted ? (
          <button
            type="button"
            disabled={isAccepting}
            onClick={onAccept}
            className="inline-flex min-h-11 items-center gap-1.5 border border-site-border bg-site-canvas px-4 py-2 text-sm font-semibold text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50"
          >
            <Check size={15} />
            {isAccepting ? t("saving") : t("acceptAnswer")}
          </button>
        ) : null}
      </div>

      <ReportDialog target={{ answer_id: answer.id }} enabled={canContribute} />

      {/* Answer Comments */}
      {comments.length > 0 ? (
        <div className="mt-6 space-y-4 border-l-2 border-site-border pl-4 sm:pl-6">
          {comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} locale={locale} enabled={canContribute} />
          ))}
        </div>
      ) : null}

      {canContribute ? <CommentComposer questionID={answer.question_id} answerID={answer.id} /> : null}
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
  return (
    <div className="border-b border-site-border/60 pb-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-site-muted">
        <User size={12} />
        <span>{comment.author?.display_name ?? t("anonymousAuthor")}</span>
      </div>
      <RichTextContent
        value={comment.body}
        locale={locale}
        defaultLocale={locale}
        className="mt-1.5 text-sm leading-7 text-site-body"
      />
      <ReportDialog target={{ comment_id: comment.id }} enabled={enabled} />
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
    <form onSubmit={submit} className="mt-10 border border-site-border bg-site-canvas p-6 sm:p-7">
      <h3 className="font-heading text-2xl font-medium text-site-foreground">{t("answerQuestion")}</h3>
      <div className="mt-4">
        <CommunityRichTextEditor
          value={body}
          onChange={setBody}
          placeholder={t("answerPlaceholder")}
          error={error}
          disabled={mutation.isPending}
        />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="min-h-11 border border-site-border bg-site-action px-6 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50"
        >
          {mutation.isPending ? t("saving") : t("submitAnswer")}
        </button>
        {success && !error ? (
          <span className="text-sm text-site-accent" role="status">
            {t("submitAnswerSuccess")}
          </span>
        ) : null}
      </div>
    </form>
  );
}

function CommentComposer({ questionID, answerID }: { questionID: string; answerID?: string }) {
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
    } catch (submitError: unknown) {
      setError(toCommunityApiError(submitError).message);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-site-muted">
        <MessageSquare size={13} />
        <span>{t("submitComment")}</span>
      </div>
      <div className="mt-2">
        <CommunityRichTextEditor
          value={body}
          onChange={setBody}
          placeholder={t("commentPlaceholder")}
          error={error}
          disabled={mutation.isPending}
        />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-3 inline-flex min-h-10 items-center border border-site-border bg-site-canvas px-4 py-2 text-sm font-semibold text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:opacity-50"
      >
        {mutation.isPending ? t("saving") : t("submitComment")}
      </button>
    </form>
  );
}
