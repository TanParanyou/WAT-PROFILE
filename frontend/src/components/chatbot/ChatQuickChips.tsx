"use client";

import React from "react";
import type { QuickQuestionDto } from "@/features/public/chatbot/types";

interface ChatQuickChipsProps {
  questions: QuickQuestionDto[];
  onSelect: (questionText: string) => void;
  disabled?: boolean;
}

export const ChatQuickChips: React.FC<ChatQuickChipsProps> = ({
  questions,
  onSelect,
  disabled,
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 pt-2">
      {questions.map((q) => (
        <button
          key={q.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(q.text)}
          className="border border-site-border bg-site-surface px-2.5 py-1.5 text-left text-xs text-site-foreground transition-all hover:border-site-accent hover:text-site-accent hover:shadow-sm active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {q.text}
        </button>
      ))}
    </div>
  );
};
