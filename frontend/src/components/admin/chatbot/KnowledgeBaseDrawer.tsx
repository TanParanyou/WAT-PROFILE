"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/ui/Drawer";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
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
  const [errors, setErrors] = useState<{ question?: string; answer?: string }>({});

  useEffect(() => {
    if (item && isOpen) {
      setCategory(item.category || "general");
      setQuestion(
        item.question
          ? {
              th: item.question.th || "",
              en: item.question.en || "",
              de: item.question.de || "",
            }
          : { ...emptyLang },
      );
      setAnswer(
        item.answer
          ? {
              th: item.answer.th || "",
              en: item.answer.en || "",
              de: item.answer.de || "",
            }
          : { ...emptyLang },
      );
      setKeywordsText((item.keywords || []).join(", "));
      setPriority(item.priority || 0);
      setIsActive(item.is_active !== undefined ? item.is_active : true);
      setErrors({});
    } else if (isOpen) {
      setCategory("general");
      setQuestion({ ...emptyLang });
      setAnswer({ ...emptyLang });
      setKeywordsText("");
      setPriority(0);
      setIsActive(true);
      setErrors({});
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { question?: string; answer?: string } = {};
    if (!question.th?.trim() && !question.en?.trim() && !question.de?.trim()) {
      newErrors.question = `${t("question")} is required`;
    }
    if (!answer.th?.trim() && !answer.en?.trim() && !answer.de?.trim()) {
      newErrors.answer = `${t("answer")} is required`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(newErrors.question || newErrors.answer || "Please complete required fields");
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

  const categoryOptions = [
    { value: "general", label: t("categoryGeneral") },
    { value: "practice", label: t("categoryPractice") },
    { value: "visiting", label: t("categoryVisiting") },
    { value: "ordination", label: t("categoryOrdination") },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={item ? t("editTitle") : t("newTitle")}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSaving}
          >
            {isSaving ? t("saving") : t("save")}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: หมวดหมู่และลำดับความสำคัญ */}
        <div className="border border-admin-border bg-admin-surface p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-admin-muted">
            1. {t("category")} &amp; {t("status")}
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Select
                label={t("category")}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoryOptions}
                required
              />
            </div>
            <div>
              <Input
                label={t("priority")}
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
              />
              <p className="mt-1 text-xs text-admin-muted">
                {t("priorityHelp")}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-admin-border/60">
            <Switch
              label={t("active")}
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </div>
        </div>

        {/* Section 2: เนื้อหาคำถามและคำตอบ */}
        <div className="border border-admin-border bg-admin-surface p-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            2. {t("question")} &amp; {t("answer")}
          </h4>

          <div>
            <MultiLangInput
              label={t("question")}
              value={question}
              onChange={(val) => {
                setQuestion(val);
                if (errors.question) setErrors((prev) => ({ ...prev, question: undefined }));
              }}
              type="input"
              required
              error={errors.question}
            />
          </div>

          <div>
            <MultiLangInput
              label={t("answer")}
              value={answer}
              onChange={(val) => {
                setAnswer(val);
                if (errors.answer) setErrors((prev) => ({ ...prev, answer: undefined }));
              }}
              type="textarea"
              required
              error={errors.answer}
            />
          </div>
        </div>

        {/* Section 3: คำค้นหาเพิ่มเติม (Keywords) */}
        <div className="border border-admin-border bg-admin-surface p-4">
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-admin-muted">
            3. {t("keywords")}
          </h4>
          <div>
            <Input
              label={t("keywords")}
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder={t("keywordsHelp")}
            />
            <p className="mt-1.5 text-xs text-admin-muted leading-relaxed">
              {t("keywordsHelp")}
            </p>
          </div>
        </div>
      </form>
    </Drawer>
  );
};
