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
import { ArrowLeft } from "lucide-react";
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

  if (query.isLoading) return <PageContainer width="reading"><div className="h-80 animate-pulse bg-site-surface" aria-label={t("loading")} /></PageContainer>;
  if (query.isError || !query.data) return <PageContainer width="reading"><QueryErrorState title={t("questionNotFound")} description={t("loadErrorDescription")} retryLabel={t("retry")} onRetry={() => query.refetch()} isRetrying={query.isFetching} /></PageContainer>;

  const detail = query.data;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Berlin" }).format(new Date(detail.last_activity_at));
  const canContribute = session.status === "authenticated" && !["locked", "archived"].includes(detail.question.lifecycle_status);
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
        <Link href="/community" className="inline-flex items-center gap-1.5 text-sm font-semibold text-site-muted underline underline-offset-4 hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"><ArrowLeft size={16} /> {t("backToCommunity")}</Link>
        <div className="mt-10 border-b border-site-border pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-site-muted"><span>{detail.question.category.name[locale]}</span><span aria-hidden="true">·</span><span>{detail.question.locale.toUpperCase()}</span><span aria-hidden="true">·</span><span>{t(detail.question.lifecycle_status)}</span></div>
          <h1 className="mt-4 font-heading text-[clamp(2rem,5vw,4rem)] font-medium leading-tight text-site-foreground">{detail.question.title}</h1>
          <p className="mt-4 text-sm text-site-muted">{t("latestActivity", { date })}{detail.question.author ? ` · ${detail.question.author.display_name}` : ""}</p>
        </div>
        <article className="border-b border-site-border py-8" aria-label={detail.question.title}><RichTextContent value={detail.body} locale={locale} defaultLocale={detail.question.locale} className="leading-8 text-site-foreground" /><ReportDialog target={{ question_id: id }} enabled={session.status === "authenticated"} /></article>
        {actionError ? <div className="mt-6 border border-site-danger/50 bg-site-danger/5 px-4 py-3 text-sm text-site-danger" role="alert">{actionError}</div> : null}
        <section className="mt-10" aria-labelledby="answers-heading">
          <h2 id="answers-heading" className="font-heading text-3xl font-medium text-site-foreground">{t("answers", { count: detail.answers.length })}</h2>
          <div className="mt-5 border-t border-site-border">
            {detail.answers.map((answer) => <AnswerCard key={answer.id} answer={answer} comments={detail.comments.filter((comment) => comment.answer_id === answer.id)} accepted={answer.id === detail.accepted_answer_id} locale={locale} canContribute={canContribute} canAccept={viewerQuery.data?.can_accept === true} isAccepting={acceptMutation.isPending} onAccept={() => accept(answer.id)} onHelpfulError={setActionError} />)}
          </div>
          {canContribute ? <AnswerComposer questionID={id} /> : null}
          {session.status !== "authenticated" ? <p className="mt-6 text-sm text-site-muted"><Link href="/account/login" className="font-semibold underline underline-offset-4">{t("signInToAnswer")}</Link></p> : null}
        </section>
        <section className="mt-10" aria-labelledby="comments-heading">
          <h2 id="comments-heading" className="font-heading text-2xl font-medium text-site-foreground">{t("comments")}</h2>
          {detail.comments.filter((comment) => !comment.answer_id).length > 0 ? <div className="mt-4 space-y-4">{detail.comments.filter((comment) => !comment.answer_id).map((comment) => <CommentRow key={comment.id} comment={comment} locale={locale} enabled={canContribute} />)}</div> : <p className="mt-4 text-sm text-site-muted">{t("noComments")}</p>}
          {canContribute ? <CommentComposer questionID={id} /> : null}
        </section>
      </PageContainer>
    </div>
  );
}

function AnswerCard({ answer, comments, accepted, locale, canContribute, canAccept, isAccepting, onAccept, onHelpfulError }: { answer: CommunityAnswer; comments: CommunityComment[]; accepted: boolean; locale: CommunityLocale; canContribute: boolean; canAccept: boolean; isAccepting: boolean; onAccept: () => void; onHelpfulError: (message: string) => void }) {
  const t = useTranslations("Community");
  return <article className="border-b border-site-border py-7"><div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-site-muted">{answer.is_official ? <span className="text-site-accent">{t("official")}</span> : null}{accepted ? <span>{t("accepted")}</span> : null}<span>{answer.author?.display_name ?? t("anonymousAuthor")}</span></div><RichTextContent value={answer.body} locale={locale} defaultLocale={locale} className="mt-4 leading-8 text-site-foreground" /><div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-site-body"><HelpfulButton answerID={answer.id} initialCount={answer.helpful_count} enabled={canContribute} onError={onHelpfulError} />{canAccept && !accepted ? <button type="button" disabled={isAccepting} onClick={onAccept} className="min-h-10 border border-site-border px-3 py-2 font-semibold hover:bg-site-surface disabled:opacity-50">{isAccepting ? t("saving") : t("acceptAnswer")}</button> : null}</div><ReportDialog target={{ answer_id: answer.id }} enabled={canContribute} />{comments.length > 0 ? <div className="mt-6 space-y-4 border-l-2 border-site-border pl-4">{comments.map((comment) => <CommentRow key={comment.id} comment={comment} locale={locale} enabled={canContribute} />)}</div> : null}{canContribute ? <CommentComposer questionID={answer.question_id} answerID={answer.id} /> : null}</article>;
}

function CommentRow({ comment, locale, enabled }: { comment: CommunityComment; locale: CommunityLocale; enabled: boolean }) {
  const t = useTranslations("Community");
  return <div><p className="text-xs font-semibold text-site-muted">{comment.author?.display_name ?? t("anonymousAuthor")}</p><RichTextContent value={comment.body} locale={locale} defaultLocale={locale} className="mt-1 text-sm leading-7 text-site-body" /><ReportDialog target={{ comment_id: comment.id }} enabled={enabled} /></div>;
}

function AnswerComposer({ questionID }: { questionID: string }) {
  const t = useTranslations("Community");
  const mutation = useCreateCommunityAnswer();
  const [body, setBody] = useState(emptyRichTextDocument());
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const result = await mutation.mutateAsync({ questionID, input: { body }, idempotencyKey: crypto.randomUUID() });
      setBody(emptyRichTextDocument());
      if (result.review_required) setError(t("reviewNotice"));
    } catch (submitError: unknown) {
      setError(toCommunityApiError(submitError).message);
    }
  };
  return <form onSubmit={submit} className="mt-8 border-y border-site-border py-6"><h3 className="font-heading text-2xl font-medium">{t("answerQuestion")}</h3><div className="mt-4"><CommunityRichTextEditor value={body} onChange={setBody} placeholder={t("answerPlaceholder")} error={error} disabled={mutation.isPending} /></div><button type="submit" disabled={mutation.isPending} className="mt-4 min-h-11 border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action disabled:opacity-50">{mutation.isPending ? t("saving") : t("submitAnswer")}</button></form>;
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
      const result = await mutation.mutateAsync({ questionID, input: { ...(answerID ? { answer_id: answerID } : {}), body }, idempotencyKey: crypto.randomUUID() });
      setBody(emptyRichTextDocument());
      if (result.review_required) setError(t("reviewNotice"));
    } catch (submitError: unknown) {
      setError(toCommunityApiError(submitError).message);
    }
  };
  return <form onSubmit={submit} className="mt-5"><CommunityRichTextEditor value={body} onChange={setBody} placeholder={t("commentPlaceholder")} error={error} disabled={mutation.isPending} /><button type="submit" disabled={mutation.isPending} className="mt-3 min-h-10 border border-site-border px-4 py-2 text-sm font-semibold hover:bg-site-surface disabled:opacity-50">{mutation.isPending ? t("saving") : t("submitComment")}</button></form>;
}
