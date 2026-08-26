"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { LotusIcon } from "./LotusIcon";
import type { ChatMessage } from "@/features/public/chatbot/types";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isThinking?: boolean;
  thinkingLabel?: string;
}

// Simple safe markdown renderer for chat bubbles
function formatMessageContent(content: string): React.ReactNode {
  const lines = content.split("\n");
  return lines.map((line, lineIdx) => {
    // Bullet points
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const bulletText = line.trim().substring(2);
      return (
        <div key={lineIdx} className="ml-2 flex items-start gap-1.5 py-0.5">
          <span className="text-site-accent select-none font-bold">•</span>
          <span className="break-words">{renderFormattedInline(bulletText)}</span>
        </div>
      );
    }

    // Numbered list item e.g. "1. "
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={lineIdx} className="ml-2 flex items-start gap-1.5 py-0.5">
          <span className="font-semibold text-site-accent select-none shrink-0">
            {numMatch[1]}.
          </span>
          <span className="break-words">{renderFormattedInline(numMatch[2])}</span>
        </div>
      );
    }

    if (line.trim() === "") {
      return <div key={lineIdx} className="h-1.5" />;
    }

    return (
      <p key={lineIdx} className="py-0.5 leading-relaxed break-words">
        {renderFormattedInline(line)}
      </p>
    );
  });
}

function renderFormattedInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const linkMatch = remaining.match(/\[(.*?)\]\((.*?)\)/);

    let nextMatchIndex = -1;
    let matchType: "bold" | "link" | null = null;
    let matchLength = 0;

    if (boldMatch && boldMatch.index !== undefined) {
      nextMatchIndex = boldMatch.index;
      matchType = "bold";
      matchLength = boldMatch[0].length;
    }

    if (
      linkMatch &&
      linkMatch.index !== undefined &&
      (nextMatchIndex === -1 || linkMatch.index < nextMatchIndex)
    ) {
      nextMatchIndex = linkMatch.index;
      matchType = "link";
      matchLength = linkMatch[0].length;
    }

    if (matchType === null || nextMatchIndex === -1) {
      parts.push(remaining);
      break;
    }

    if (nextMatchIndex > 0) {
      parts.push(remaining.substring(0, nextMatchIndex));
    }

    if (matchType === "bold" && boldMatch) {
      parts.push(
        <strong key={`b-${keyCounter++}`} className="font-semibold text-site-foreground">
          {boldMatch[1]}
        </strong>,
      );
    } else if (matchType === "link" && linkMatch) {
      const rawUrl = linkMatch[2].trim();
      const isSafeUrl = /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(rawUrl);
      const isInternal = rawUrl.startsWith("/") || rawUrl.startsWith("#");

      if (isSafeUrl) {
        parts.push(
          <a
            key={`l-${keyCounter++}`}
            href={rawUrl}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
            className="text-site-accent font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        parts.push(linkMatch[1]);
      }
    }

    remaining = remaining.substring(nextMatchIndex + matchLength);
  }

  return parts;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isThinking,
  thinkingLabel,
}) => {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-atomic="false"
      className="flex flex-col space-y-3 text-xs sm:text-sm"
    >
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {/* Bot Lotus Avatar Icon */}
            {!isUser && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-site-border bg-site-surface text-site-accent shadow-xs">
                {msg.isError ? (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                ) : (
                  <LotusIcon size={18} className="text-site-accent" />
                )}
              </div>
            )}

            <div
              className={`max-w-[85%] border px-3.5 py-2.5 shadow-xs ${
                isUser
                  ? "border-site-border bg-site-action text-white dark:text-neutral-900"
                  : msg.isError
                    ? "border-amber-600/40 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200"
                    : "border-site-border bg-site-surface text-site-foreground"
              }`}
            >
              {formatMessageContent(msg.content)}
              <div
                className={`mt-1.5 text-[10px] ${
                  isUser
                    ? "text-white/70 dark:text-neutral-900/70 text-right"
                    : "text-site-foreground/50"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        );
      })}

      {isThinking && (
        <div className="flex items-start gap-2 justify-start">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-site-border bg-site-surface text-site-accent shadow-xs">
            <LotusIcon size={18} className="text-site-accent animate-pulse" />
          </div>
          <div className="flex items-center space-x-1.5 border border-site-border bg-site-surface px-3.5 py-2.5 text-xs text-site-foreground/70 shadow-xs">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-site-accent" />
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-site-accent [animation-delay:0.2s]" />
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-site-accent [animation-delay:0.4s]" />
            <span className="ml-1.5 text-xs">{thinkingLabel || "Thinking..."}</span>
          </div>
        </div>
      )}
    </div>
  );
};
