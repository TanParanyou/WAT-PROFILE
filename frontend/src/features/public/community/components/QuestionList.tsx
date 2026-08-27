import { Link } from "@/navigation";
import type { CommunityLocale, CommunityQuestionListItem } from "../types";
import { CheckCircle2, MessageSquare, ShieldCheck, User } from "lucide-react";
import { formatDateTimeWithRelative } from "@/utils/formatters";

interface QuestionListProps {
  items: readonly CommunityQuestionListItem[];
  locale: CommunityLocale;
  answerLabel: (count: number) => string;
  activityLabel: (date: string) => string;
  statusLabel: (status: CommunityQuestionListItem["lifecycle_status"]) => string;
}

export function QuestionList({ items, locale, answerLabel, activityLabel, statusLabel }: QuestionListProps) {
  return (
    <div className="divide-y divide-site-border border-y border-site-border" role="list">
      {items.map((item) => {
        const date = formatDateTimeWithRelative(item.last_activity_at, locale);
        const isResolved = item.lifecycle_status === "resolved";
        const hasOfficial = item.official_answer_count > 0;
        const hasAnswers = item.published_answer_count > 0;

        return (
          <article key={item.id} role="listitem" className="group py-6 transition-colors hover:bg-site-surface/30 sm:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-site-muted">
                  <Link
                    href={`/community/category/${item.category.slug}`}
                    className="border border-site-border bg-site-surface px-2 py-0.5 text-site-foreground transition-colors hover:bg-site-surface/80"
                  >
                    {item.category.name[locale] || item.category.name.th || item.category.name.en || item.category.name.de || item.category.slug}
                  </Link>

                  <span className="border border-site-border/70 px-2 py-0.5">{item.locale.toUpperCase()}</span>

                  <span
                    className={`border px-2 py-0.5 ${
                      isResolved
                        ? "border-site-border bg-site-action text-site-on-action"
                        : hasAnswers
                          ? "border-site-border bg-site-surface text-site-foreground"
                          : "border-site-border/70 text-site-muted"
                    }`}
                  >
                    {statusLabel(item.lifecycle_status)}
                  </span>

                  {hasOfficial ? (
                    <span className="inline-flex items-center gap-1 border border-site-accent/50 bg-site-surface px-2 py-0.5 text-site-accent">
                      <ShieldCheck size={13} />
                      <span>Official</span>
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-3 font-heading text-xl font-medium leading-snug text-site-foreground transition-colors sm:text-2xl">
                  <Link
                    href={`/community/q/${item.id}/${encodeURIComponent(item.slug)}`}
                    className="underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-site-border focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                  >
                    {item.title}
                  </Link>
                </h3>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-site-muted">
                  <span>{activityLabel(date)}</span>
                  {item.author ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 text-site-body">
                        <User size={12} />
                        <span className="max-w-40 truncate">{item.author.display_name}</span>
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Answer Count Metric Box */}
              <div className="flex shrink-0 items-center sm:pt-1">
                <div
                  className={`flex min-h-12 min-w-20 flex-col items-center justify-center border px-3 py-1.5 text-center transition-colors ${
                    isResolved
                      ? "border-site-border bg-site-action text-site-on-action"
                      : hasAnswers
                        ? "border-site-border bg-site-surface text-site-foreground"
                        : "border-site-border/60 bg-site-canvas text-site-muted"
                  }`}
                  aria-label={answerLabel(item.published_answer_count)}
                >
                  <div className="flex items-center gap-1.5 font-heading text-lg font-medium leading-none">
                    {isResolved ? <CheckCircle2 size={15} /> : <MessageSquare size={14} />}
                    <span>{item.published_answer_count}</span>
                  </div>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-85">
                    {answerLabel(item.published_answer_count)}
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
