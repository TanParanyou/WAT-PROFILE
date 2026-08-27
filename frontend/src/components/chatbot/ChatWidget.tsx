"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  X,
  Minus,
  Send,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  useQuickQuestionsQuery,
  useSendChatMessageMutation,
} from "@/features/public/chatbot/queries";
import type { ChatMessage } from "@/features/public/chatbot/types";
import { ChatMessageList } from "./ChatMessageList";
import { ChatQuickChips } from "./ChatQuickChips";
import { LotusIcon } from "./LotusIcon";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";
import { useChatbotStore } from "@/features/public/chatbot/chatbotStore";
import { cn } from "@/utils/cn";

interface ChatWidgetInnerProps {
  locale: string;
}

const ChatWidgetInner: React.FC<ChatWidgetInnerProps> = ({ locale }) => {
  const t = useTranslations("Chatbot");
  const settings = usePublicSiteSettings();
  const { isOpen, close: closeChat } = useChatbotStore();

  // If chatbot is disabled in settings, do not render
  const isEnabled = settings.features.chatbot;

  const storageKey = `wat_chatbot_history_${locale}`;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") {
      return [
        {
          id: "welcome-msg",
          role: "model",
          content: `**${t("welcomeHeading")}**\n\n${t("welcomeMessage")}`,
          timestamp: "",
        },
      ];
    }
    try {
      const stored = sessionStorage.getItem(`wat_chatbot_history_${locale}`);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }

    return [
      {
        id: "welcome-msg",
        role: "model",
        content: `**${t("welcomeHeading")}**\n\n${t("welcomeMessage")}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ];
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: quickQuestions = [] } = useQuickQuestionsQuery(locale);
  const sendMutation = useSendChatMessageMutation();

  // Save conversation to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(messages));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [messages, storageKey]);

  // Auto-scroll on new message or when typing indicator shows
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, sendMutation.isPending]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Global Escape key listener to close modal or chat
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else if (isOpen) {
          closeChat();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, showConfirmModal, closeChat]);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputText).trim();
      if (!text || sendMutation.isPending) return;

      const userMsgTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: userMsgTime,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");

      // Prepare history for backend (latest 8 messages)
      const history = messages
        .filter((m) => m.id !== "welcome-msg")
        .slice(-8)
        .map((m) => ({
          role: (m.role === "user" ? "user" : "model") as "user" | "model",
          content: m.content,
        }));

      try {
        const res = await sendMutation.mutateAsync({
          message: text,
          locale: locale || "th",
          history,
        });

        const botMsgTime = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "model",
          content: res.reply,
          timestamp: botMsgTime,
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch {
        const errorMsgTime = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "model",
          content: t("errorFallback"),
          timestamp: errorMsgTime,
          isError: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    [inputText, sendMutation, messages, locale, t],
  );

  const handleConfirmClear = () => {
    sessionStorage.removeItem(storageKey);
    setMessages([
      {
        id: "welcome-msg",
        role: "model",
        content: `**${t("welcomeHeading")}**\n\n${t("welcomeMessage")}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setShowConfirmModal(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isEnabled || !isOpen) {
    return null;
  }

  const isSocialsOnRight = settings.socialSidebarPosition === "right";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("assistantTitle")}
      className={cn(
        "fixed z-50 flex flex-col border border-site-border bg-site-canvas shadow-2xl print:hidden transition-all",
        // Mobile viewport: full width bottom sheet
        "max-sm:inset-x-0 max-sm:bottom-0 max-sm:h-[85vh] max-sm:max-h-[85vh] max-sm:w-full",
        // Tablet & Desktop: fixed geometry
        "sm:bottom-6 sm:h-[580px] sm:max-h-[85vh] sm:w-[380px] sm:min-h-[420px]",
        isSocialsOnRight ? "sm:right-22 lg:right-24" : "sm:left-22 lg:left-24"
      )}
    >
      {/* Header - Fixed Height */}
      <div className="shrink-0 flex items-center justify-between border-b border-site-border bg-site-surface px-4 py-3">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center border border-site-border bg-site-canvas text-site-accent">
            <LotusIcon size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-site-foreground">
              {t("assistantTitle")}
            </h3>
            <div className="flex items-center space-x-1.5 text-[11px] text-site-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{t("statusOnline")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            title={t("clearChat")}
            aria-label={t("clearChat")}
            className="p-1.5 text-site-foreground/60 transition-colors hover:text-red-600 hover:bg-site-canvas"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={closeChat}
            title={t("minimize")}
            aria-label={t("minimize")}
            className="p-1.5 text-site-foreground/60 transition-colors hover:text-site-foreground hover:bg-site-canvas"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={closeChat}
            title={t("close")}
            aria-label={t("close")}
            className="p-1.5 text-site-foreground/60 transition-colors hover:text-site-foreground hover:bg-site-canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area - min-h-0 allows flex child to scroll properly */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-3"
      >
        <ChatMessageList
          messages={messages}
          isThinking={sendMutation.isPending}
          thinkingLabel={t("typing")}
        />

        {/* Suggested Chips when chat has few messages */}
        {messages.length <= 2 && quickQuestions.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-site-foreground/60">
              {t("suggestedTitle")}
            </p>
            <ChatQuickChips
              questions={quickQuestions}
              disabled={sendMutation.isPending}
              onSelect={(q) => handleSendMessage(q)}
            />
          </div>
        )}
      </div>

      {/* Disclaimer - Fixed Height */}
      <div className="shrink-0 border-t border-site-border/60 bg-site-surface/60 px-3 py-1.5 text-center text-[10px] leading-tight text-site-foreground/60">
        {t("disclaimer")}
      </div>

      {/* Footer Input - Fixed Height */}
      <div className="shrink-0 border-t border-site-border bg-site-surface p-2.5">
        <div className="flex items-center gap-2 border border-site-border bg-site-canvas p-1.5 focus-within:border-site-accent">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("inputPlaceholder")}
            rows={1}
            maxLength={500}
            disabled={sendMutation.isPending}
            className="h-[36px] max-h-[72px] flex-1 resize-none bg-transparent px-2 py-1.5 text-base sm:text-xs text-site-foreground placeholder:text-site-foreground/40 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || sendMutation.isPending}
            aria-label={t("send")}
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-site-action text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-900"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* In-App Confirmation Modal Component for Clear Chat */}
      {showConfirmModal && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="clear-chat-title"
          aria-describedby="clear-chat-desc"
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-[280px] border border-site-border bg-site-canvas p-5 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center border border-site-border bg-site-surface text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h4
              id="clear-chat-title"
              className="text-xs font-bold uppercase tracking-wider text-site-foreground"
            >
              {t("clearChat")}
            </h4>
            <p
              id="clear-chat-desc"
              className="mt-2 text-xs leading-relaxed text-site-foreground/75"
            >
              {t("resetConfirm")}
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="border border-site-border bg-site-surface px-3 py-1.5 text-xs font-medium text-site-foreground hover:bg-site-canvas transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="border border-red-600 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
              >
                {t("clearChat")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ChatWidget: React.FC = () => {
  const locale = useLocale();
  return <ChatWidgetInner key={locale} locale={locale} />;
};
