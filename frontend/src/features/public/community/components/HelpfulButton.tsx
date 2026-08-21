"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ThumbsUp } from "lucide-react";
import { toCommunityApiError } from "../api";
import { useSetCommunityHelpful } from "../queries";

export function HelpfulButton({
  answerID,
  initialCount,
  initialVoted = false,
  enabled,
  onError,
}: {
  answerID: string;
  initialCount: number;
  initialVoted?: boolean;
  enabled: boolean;
  onError?: (message: string) => void;
}) {
  const t = useTranslations("Community");
  const mutation = useSetCommunityHelpful();
  const [state, setState] = useState({ count: initialCount, voted: initialVoted });

  const toggle = async () => {
    if (!enabled || mutation.isPending) return;
    const previous = state;
    const next = { count: Math.max(0, previous.count + (previous.voted ? -1 : 1)), voted: !previous.voted };
    setState(next);
    onError?.("");
    try {
      const result = await mutation.mutateAsync({ answerID, helpful: next.voted });
      setState({ count: result.helpful_count, voted: result.has_voted });
    } catch (error: unknown) {
      setState(previous);
      onError?.(toCommunityApiError(error).message);
    }
  };

  return (
    <button
      type="button"
      disabled={!enabled || mutation.isPending}
      aria-pressed={state.voted}
      onClick={toggle}
      className={`inline-flex min-h-11 items-center gap-2 border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-50 ${
        state.voted
          ? "border-site-accent/70 bg-site-surface text-site-accent"
          : "border-site-border bg-site-canvas text-site-foreground hover:bg-site-surface"
      }`}
    >
      <ThumbsUp size={15} className={state.voted ? "fill-current" : ""} aria-hidden="true" />
      <span>{t("helpful")}</span>
      <span className="font-mono text-xs opacity-80" aria-hidden="true">·</span>
      <span className="font-mono text-xs">{state.count}</span>
    </button>
  );
}
