"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/ui/Drawer";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { adminChatbotService } from "@/services/adminChatbotService";
import { useToast } from "@/hooks/useToast";
import type {
  ChatbotKnowledgeBaseItem,
  ChatbotKnowledgeBaseInput,
} from "@/types/chatbot";
import type { MultiLangText } from "@/types/api";

interface KnowledgeBaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: ChatbotKnowledgeBaseItem | null;
  onSuccess: () => void;
}

const emptyLang: MultiLangText = { th: "", en: "", de: "" };

export const KnowledgeBaseDrawer: React.FC<KnowledgeBaseDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const t = useTranslations("Admin.chatbot");
  const { toast } = useToast();

  const [category, setCategory] = useState("general");
  const [question, setQuestion] = useState<MultiLangText>(emptyLang);
  const [answer, setAnswer] = useState<MultiLangText>(emptyLang);
  const [keywordsText, setKeywordsText] = useState("");
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setCategory(item.category || "general");
      setQuestion(item.question || emptyLang);
      setAnswer(item.answer || emptyLang);
      setKeywordsText((item.keywords || []).join(", "));
      setPriority(item.priority || 0);
      setIsActive(item.is_active !== undefined ? item.is_active : true);
    } else {
      setCategory("general");
      setQuestion(emptyLang);
      setAnswer(emptyLang);
      setKeywordsText("");
      setPriority(0);
      setIsActive(true);
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.th?.trim() && !question.en?.trim() && !question.de?.trim()) {
      toast.error(t("question") + " is required");
      return;
    }
    if (!answer.th?.trim() && !answer.en?.trim() && !answer.de?.trim()) {
      toast.error(t("answer") + " is required");
      return;
    }

    const keywords = keywordsText
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const payload: ChatbotKnowledgeBaseInput = {
      category,
      question,
      answer,
      keywords,
      priority,
      is_active: isActive,
    };

    setIsSaving(true);
    try {
      if (item?.id) {
        await adminChatbotService.updateKnowledgeBase(item.id, payload);
      } else {
        await adminChatbotService.createKnowledgeBase(payload);
      }
      toast.success(t("saveSuccess"));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "An error occurred while saving";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={item ? t("editTitle") : t("newTitle")}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {isSaving ? t("saving") : t("save")}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category & Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              {t("category")}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="general">{t("categoryGeneral")}</option>
              <option value="practice">{t("categoryPractice")}</option>
              <option value="visiting">{t("categoryVisiting")}</option>
              <option value="ordination">{t("categoryOrdination")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              {t("priority")}
            </label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
              className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {t("priorityHelp")}
            </p>
          </div>
        </div>

        {/* Question (MultiLang) */}
        <div>
          <MultiLangInput
            label={t("question")}
            value={question}
            onChange={(val) => setQuestion(val)}
            type="input"
            required
          />
        </div>

        {/* Answer (MultiLang) */}
        <div>
          <MultiLangInput
            label={t("answer")}
            value={answer}
            onChange={(val) => setAnswer(val)}
            type="textarea"
            required
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            {t("keywords")}
          </label>
          <input
            type="text"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder={t("keywordsHelp")}
            className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            {t("keywordsHelp")}
          </p>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            id="is_active_toggle"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
          />
          <label
            htmlFor="is_active_toggle"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {t("active")}
          </label>
        </div>
      </form>
    </Drawer>
  );
};
