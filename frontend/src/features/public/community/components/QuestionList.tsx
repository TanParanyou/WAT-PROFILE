import { Link } from "@/navigation";
import type { CommunityLocale, CommunityQuestionListItem } from "../types";

interface QuestionListProps {
  items: readonly CommunityQuestionListItem[];
  locale: CommunityLocale;
  answerLabel: (count: number) => string;
  activityLabel: (date: string) => string;
  statusLabel: (status: CommunityQuestionListItem["lifecycle_status"]) => string;
}

const dateOptions: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeZone: "Europe/Berlin",
};

export function QuestionList({ items, locale, answerLabel, activityLabel, statusLabel }: QuestionListProps) {
  return (
    <div className="border-t border-site-border" role="list">
      {items.map((item) => {
        const date = new Intl.DateTimeFormat(locale, dateOptions).format(new Date(item.last_activity_at));
        return (
          <article key={item.id} role="listitem" className="border-b border-site-border py-6 sm:py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-site-muted">
                  <Link href={`/community/category/${item.category.slug}`} className="underline decoration-site-border underline-offset-4 hover:text-site-foreground">
                    {item.category.name[locale]}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <span>{item.locale.toUpperCase()}</span>
                  <span aria-hidden="true">·</span>
                  <span>{statusLabel(item.lifecycle_status)}</span>
                </div>
                <h3 className="mt-3 font-heading text-2xl font-medium leading-tight text-site-foreground sm:text-3xl">
                  <Link href={`/community/q/${item.id}/${encodeURIComponent(item.slug)}`} className="underline decoration-transparent underline-offset-4 transition-colors hover:decoration-site-border focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-3 text-sm text-site-body">{activityLabel(date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-5 text-sm text-site-body sm:pt-1">
                <span>{answerLabel(item.published_answer_count)}</span>
                {item.author ? <span className="max-w-36 truncate">{item.author.display_name}</span> : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
