"use client";

import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import PageContainer from "@/components/layout/PageContainer";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { RichTextContent } from "@/components/admin/rich-text/RichTextContent";
import { useCommunityQuestionQuery } from "../queries";
import type { CommunityLocale } from "../types";

function supportedLocale(value: string): CommunityLocale {
  return value === "en" || value === "de" ? value : "th";
}

export function QuestionDetailContent({ id }: { id: string }) {
  const locale = supportedLocale(useLocale());
  const t = useTranslations("Community");
  const query = useCommunityQuestionQuery(id);

  if (query.isLoading) return <PageContainer width="reading"><div className="h-80 animate-pulse bg-site-surface" aria-label={t("loading")} /></PageContainer>;
  if (query.isError || !query.data) return <PageContainer width="reading"><QueryErrorState title={t("questionNotFound")} description={t("loadErrorDescription")} retryLabel={t("retry")} onRetry={() => query.refetch()} isRetrying={query.isFetching} /></PageContainer>;

  const detail = query.data;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Berlin" }).format(new Date(detail.last_activity_at));
  return (
    <div className="min-h-screen bg-site-canvas">
      <PageContainer width="reading">
        <Link href="/community" className="text-sm font-semibold text-site-muted underline underline-offset-4 hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">← {t("backToCommunity")}</Link>
        <div className="mt-10 border-b border-site-border pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-site-muted"><span>{detail.question.category.name[locale]}</span><span aria-hidden="true">·</span><span>{detail.question.locale.toUpperCase()}</span><span aria-hidden="true">·</span><span>{t(detail.question.lifecycle_status)}</span></div>
          <h1 className="mt-4 font-heading text-[clamp(2rem,5vw,4rem)] font-medium leading-tight text-site-foreground">{detail.question.title}</h1>
          <p className="mt-4 text-sm text-site-muted">{t("latestActivity", { date })}{detail.question.author ? ` · ${detail.question.author.display_name}` : ""}</p>
        </div>
        <article className="border-b border-site-border py-8" aria-label={detail.question.title}><RichTextContent value={detail.body} locale={locale} defaultLocale={detail.question.locale} className="leading-8 text-site-foreground" /></article>
        <section className="mt-10" aria-labelledby="answers-heading">
          <h2 id="answers-heading" className="font-heading text-3xl font-medium text-site-foreground">{t("answers", { count: detail.answers.length })}</h2>
          <div className="mt-5 border-t border-site-border">
            {detail.answers.map((answer) => <article key={answer.id} className="border-b border-site-border py-7"><div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-site-muted">{answer.is_official ? <span className="text-site-accent">{t("official")}</span> : null}{answer.id === detail.accepted_answer_id ? <span>{t("accepted")}</span> : null}<span>{answer.author?.display_name ?? t("anonymousAuthor")}</span></div><RichTextContent value={answer.body} locale={locale} defaultLocale={detail.question.locale} className="mt-4 leading-8 text-site-foreground" /><p className="mt-4 text-sm text-site-muted">{t("helpful")} · {answer.helpful_count}</p></article>)}
          </div>
        </section>
        {detail.comments.length > 0 ? <section className="mt-10" aria-labelledby="comments-heading"><h2 id="comments-heading" className="font-heading text-2xl font-medium text-site-foreground">{t("comments")}</h2><div className="mt-4 space-y-4">{detail.comments.map((comment) => <div key={comment.id} className="border-l-2 border-site-border pl-4"><p className="text-xs font-semibold text-site-muted">{comment.author?.display_name ?? t("anonymousAuthor")}</p><RichTextContent value={comment.body} locale={locale} defaultLocale={detail.question.locale} className="mt-1 text-sm leading-7 text-site-body" /></div>)}</div></section> : null}
      </PageContainer>
    </div>
  );
}
