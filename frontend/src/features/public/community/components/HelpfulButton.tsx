"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
      className="min-h-10 border border-site-border px-3 py-2 text-sm font-semibold hover:bg-site-surface disabled:cursor-not-allowed disabled:opacity-50"
    >
      {t("helpful")} · {state.count}
    </button>
  );
}
