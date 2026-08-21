"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { emptyRichTextDocument } from "@/lib/rich-text/document";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import { toCommunityApiError } from "../api";
import {
  useCommunityCategoriesQuery,
  useCreateCommunityQuestion,
  useUpdateCommunityQuestion,
} from "../queries";
import type { CommunityLocale, CommunityQuestionMutation } from "../types";
import { CommunityRichTextEditor } from "./CommunityRichTextEditor";
import { Check, Clock, Globe, Info, Sparkles } from "lucide-react";

interface QuestionFormProps {
  initial?: CommunityQuestionMutation;
}

function supportedLocale(value: string): CommunityLocale {
  return value === "en" || value === "de" ? value : "th";
}

function textFromDocument(value: unknown): string {
  if (typeof value !== "object" || value === null) return "";
  const candidate = value as { text?: unknown; content?: unknown };
  const text = typeof candidate.text === "string" ? candidate.text : "";
  const children = Array.isArray(candidate.content) ? candidate.content.map(textFromDocument).join(" ") : "";
  return `${text} ${children}`.trim();
}

const LOCALE_LABELS: Record<CommunityLocale, string> = {
  th: "ไทย (Thai)",
  en: "English",
  de: "Deutsch",
};

export function QuestionForm({ initial }: QuestionFormProps) {
  const t = useTranslations("Community");
  const locale = supportedLocale(useLocale());
  const router = useRouter();
  const session = useAccountSession();
  const categoriesQuery = useCommunityCategoriesQuery();
  const createMutation = useCreateCommunityQuestion();
  const updateMutation = useUpdateCommunityQuestion();
  const [categoryID, setCategoryID] = useState(initial?.question.category.id ?? "");
  const [questionLocale, setQuestionLocale] = useState<CommunityLocale>(initial?.question.locale ?? locale);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [title, setTitle] = useState(initial?.question.title ?? "");
  const [body, setBody] = useState(initial?.body ?? emptyRichTextDocument());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submittedReviewRequired, setSubmittedReviewRequired] = useState(false);
  const isEditing = Boolean(initial);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const selectedCategory = useMemo(
    () => categoriesQuery.data?.find((item) => item.id === categoryID),
    [categoriesQuery.data, categoryID],
  );

  const titleLength = [...title.trim()].length;
  const bodyLength = [...textFromDocument(body)].length;

  if (session.status === "loading") {
    return (
      <div className="border-y border-site-border py-12 text-sm text-site-muted animate-pulse" aria-live="polite">
        {t("loading")}
      </div>
    );
  }

  if (session.status !== "authenticated") {
    return (
      <div className="border border-site-border bg-site-surface p-8">
        <h2 className="font-heading text-2xl font-medium text-site-foreground">{t("signInToAsk")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-site-body">{t("signInToAskDescription")}</p>
        <Link
          href="/account/login"
          className="mt-6 inline-flex min-h-11 items-center border border-site-border bg-site-action px-6 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
        >
          {t("signIn")}
        </Link>
      </div>
    );
  }

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isEditing && !categoryID) next.category_id = t("categoryRequired");
    if (titleLength < 10) next.title = t("titleMin");
    if (titleLength > 200) next.title = t("titleMax");
    if (bodyLength < 20) next.body = t("bodyMin");
    if (bodyLength > 20000) next.body = t("bodyMax");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    try {
      const result = isEditing
        ? await updateMutation.mutateAsync({
            id: initial!.question.id,
            input: { title: title.trim(), body, expected_version: initial!.version },
          })
        : await createMutation.mutateAsync({
            input: { category_id: categoryID, locale: questionLocale, title: title.trim(), body },
            idempotencyKey: crypto.randomUUID(),
          });

      if (result.review_required) {
        setSubmittedReviewRequired(true);
      } else {
        router.push(`/community/q/${result.question.id}/${encodeURIComponent(result.question.slug)}`);
      }
    } catch (error: unknown) {
      const apiError = toCommunityApiError(error);
      setSubmitError(apiError.message);
      if (apiError.fieldErrors.length > 0) {
        setErrors(Object.fromEntries(apiError.fieldErrors.map((item) => [item.field, item.message])));
      }
    }
  };

  if (submittedReviewRequired) {
    return (
      <div className="border border-site-accent/60 bg-site-surface p-6 sm:p-8">
        <div className="flex items-center gap-2.5 text-site-accent font-semibold text-xs uppercase tracking-wider">
          <Clock size={16} />
          <span>{t("pendingReview")}</span>
        </div>
        <h2 className="mt-3 font-heading text-2xl font-medium text-site-foreground">{t("reviewNotice")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-site-body">{t("verifiedOnlyNotice")}</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/community/activity"
            className="inline-flex min-h-11 items-center border border-site-border bg-site-action px-6 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          >
            {t("myActivity")}
          </Link>
          <Link
            href="/community"
            className="inline-flex min-h-11 items-center border border-site-border bg-site-canvas px-5 text-sm font-semibold text-site-foreground hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          >
            {t("backToCommunity")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      {/* Category Chips Selection */}
      {!isEditing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label className="block text-sm font-semibold text-site-foreground">
              {t("chooseCategory")} <span className="text-site-danger">*</span>
            </label>
            <span className="text-xs text-site-muted">{t("selectCategoryHint")}</span>
          </div>

          <div
            role="radiogroup"
            aria-label={t("chooseCategory")}
            className="flex flex-wrap gap-2.5"
          >
            {categoriesQuery.data?.map((category) => {
              const isSelected = categoryID === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    setCategoryID(category.id);
                    if (errors.category_id) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.category_id;
                        return copy;
                      });
                    }
                  }}
                  className={`inline-flex min-h-11 items-center gap-2 border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus ${
                    isSelected
                      ? "border-site-action bg-site-action text-site-on-action shadow-sm"
                      : "border-site-border bg-site-surface text-site-foreground hover:border-site-foreground/50 hover:bg-site-canvas"
                  }`}
                >
                  {isSelected && <Check size={14} className="shrink-0" />}
                  <span>{category.name[locale]}</span>
                </button>
              );
            })}
          </div>

          {selectedCategory?.description?.[locale] ? (
            <p className="flex items-start gap-1.5 text-xs text-site-muted">
              <Info size={14} className="mt-0.5 shrink-0 text-site-accent" />
              <span>{selectedCategory.description[locale]}</span>
            </p>
          ) : null}

          {errors.category_id ? (
            <p className="text-xs font-medium text-site-danger" role="alert">
              {errors.category_id}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Title Field */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="community-title" className="block text-sm font-semibold text-site-foreground">
            {t("questionTitle")} <span className="text-site-danger">*</span>
          </label>
          <span className={`text-xs ${titleLength > 200 ? "text-site-danger font-semibold" : "text-site-muted"}`}>
            {titleLength}/200 {titleLength > 0 && titleLength < 10 ? `(อีก ${10 - titleLength} ตัวอักษร)` : ""}
          </span>
        </div>
        <input
          id="community-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (errors.title && event.target.value.trim().length >= 10) {
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.title;
                return copy;
              });
            }
          }}
          maxLength={200}
          placeholder={t("questionTitlePlaceholder")}
          className="min-h-12 w-full border border-site-border bg-site-canvas px-4 text-base text-site-foreground outline-none transition-colors focus-visible:border-site-focus focus-visible:ring-2 focus-visible:ring-site-focus/30"
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title ? (
          <p className="text-xs font-medium text-site-danger" role="alert">
            {errors.title}
          </p>
        ) : null}
      </div>

      {/* Body Field with Rich Text Editor */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="block text-sm font-semibold text-site-foreground" htmlFor="community-body">
            {t("questionBody")} <span className="text-site-danger">*</span>
          </label>
          <span className={`text-xs ${bodyLength > 20000 ? "text-site-danger font-semibold" : "text-site-muted"}`}>
            {bodyLength}/20,000 {bodyLength > 0 && bodyLength < 20 ? `(อีก ${20 - bodyLength} ตัวอักษร)` : ""}
          </span>
        </div>
        <div id="community-body">
          <CommunityRichTextEditor
            value={body}
            onChange={(val) => {
              setBody(val);
              if (errors.body && [...textFromDocument(val)].length >= 20) {
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.body;
                  return copy;
                });
              }
            }}
            placeholder={t("bodyPlaceholder")}
            error={errors.body}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Language Subtle Toggle */}
      {!isEditing && (
        <div className="border-t border-site-border/60 pt-4">
          {!showLanguagePicker ? (
            <button
              type="button"
              onClick={() => setShowLanguagePicker(true)}
              className="inline-flex items-center gap-1.5 text-xs text-site-muted hover:text-site-foreground focus-visible:outline-2 focus-visible:outline-site-focus"
            >
              <Globe size={14} />
              <span>{t("questionLanguage")}: <strong>{LOCALE_LABELS[questionLocale]}</strong></span>
              <span className="underline ml-1">({t("changeLanguage")})</span>
            </button>
          ) : (
            <div className="space-y-2">
              <label htmlFor="community-locale-select" className="block text-xs font-medium text-site-foreground">
                {t("questionLanguage")}
              </label>
              <div className="flex flex-wrap gap-2">
                {(["th", "en", "de"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setQuestionLocale(lang)}
                    className={`min-h-9 border px-3 text-xs font-medium transition-colors ${
                      questionLocale === lang
                        ? "border-site-action bg-site-action text-site-on-action"
                        : "border-site-border bg-site-surface text-site-foreground hover:bg-site-canvas"
                    }`}
                  >
                    {LOCALE_LABELS[lang]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {submitError ? (
        <div className="border border-site-danger/50 bg-site-danger/5 px-4 py-3 text-sm text-site-danger" role="alert">
          {submitError}
        </div>
      ) : null}

      {/* Submit Section with Verification Notice */}
      <div className="space-y-4 border-t border-site-border pt-6">
        <div className="flex items-start gap-2.5 text-xs text-site-muted">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-site-accent" aria-hidden="true" />
          <p className="leading-relaxed">{t("verifiedOnlyNotice")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 border border-site-border bg-site-action px-7 text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? t("saving") : isEditing ? t("saveChanges") : t("submitQuestion")}
          </button>
          <Link
            href={isEditing ? "/community/activity" : "/community"}
            className="inline-flex min-h-11 items-center border border-site-border bg-site-canvas px-5 text-sm font-semibold text-site-muted transition-colors hover:bg-site-surface hover:text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus"
          >
            {t("cancel")}
          </Link>
        </div>
      </div>
    </form>
  );
}
