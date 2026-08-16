"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { emptyRichTextDocument } from "@/lib/rich-text/document";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import {
  toCommunityApiError,
} from "../api";
import {
  useCommunityCategoriesQuery,
  useCreateCommunityQuestion,
  useUpdateCommunityQuestion,
} from "../queries";
import type { CommunityLocale, CommunityQuestionMutation } from "../types";
import { CommunityRichTextEditor } from "./CommunityRichTextEditor";

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
  const [title, setTitle] = useState(initial?.question.title ?? "");
  const [body, setBody] = useState(initial?.body ?? emptyRichTextDocument());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isEditing = Boolean(initial);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const selectedCategory = useMemo(() => categoriesQuery.data?.find((item) => item.id === categoryID), [categoriesQuery.data, categoryID]);

  if (session.status === "loading") {
    return <div className="border-y border-site-border py-12 text-sm text-site-muted" aria-live="polite">{t("loading")}</div>;
  }
  if (session.status !== "authenticated") {
    return (
      <div className="border-y border-site-border py-12">
        <h2 className="font-heading text-2xl font-medium text-site-foreground">{t("signInToAsk")}</h2>
        <p className="mt-3 text-site-body">{t("signInToAskDescription")}</p>
        <Link href="/account/login" className="mt-6 inline-flex min-h-11 items-center border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus">{t("signIn")}</Link>
      </div>
    );
  }

  const validate = () => {
    const next: Record<string, string> = {};
    const titleLength = [...title.trim()].length;
    const bodyLength = [...textFromDocument(body)].length;
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
        ? await updateMutation.mutateAsync({ id: initial!.question.id, input: { title: title.trim(), body, expected_version: initial!.version } })
        : await createMutation.mutateAsync({ input: { category_id: categoryID, locale: questionLocale, title: title.trim(), body }, idempotencyKey: crypto.randomUUID() });
      setSubmitted(result.review_required);
      if (result.review_required) {
        router.push("/community/activity");
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

  if (submitted) {
    return <div className="border-y border-site-border py-12 text-site-body">{t("reviewNotice")}</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div className="border-b border-site-border pb-6">
        <p className="text-sm leading-7 text-site-body">{t("verifiedOnlyNotice")}</p>
      </div>
      {!isEditing ? (
        <div>
          <label htmlFor="community-category" className="block text-sm font-semibold text-site-foreground">{t("category")}</label>
          <select id="community-category" value={categoryID} onChange={(event) => setCategoryID(event.target.value)} className="mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-site-focus/30" aria-invalid={Boolean(errors.category_id)}>
            <option value="">{t("chooseCategory")}</option>
            {categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{category.name[locale]}</option>)}
          </select>
          {selectedCategory ? <p className="mt-2 text-sm text-site-muted">{selectedCategory.description?.[locale]}</p> : null}
          {errors.category_id ? <p className="mt-2 text-sm text-site-danger" role="alert">{errors.category_id}</p> : null}
        </div>
      ) : null}
      {!isEditing ? (
        <div>
          <label htmlFor="community-locale" className="block text-sm font-semibold text-site-foreground">{t("language")}</label>
          <select id="community-locale" value={questionLocale} onChange={(event) => setQuestionLocale(supportedLocale(event.target.value))} className="mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-site-focus/30">
            <option value="th">ไทย</option><option value="en">English</option><option value="de">Deutsch</option>
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="community-title" className="block text-sm font-semibold text-site-foreground">{t("questionTitle")}</label>
        <input id="community-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className="mt-2 min-h-12 w-full border border-site-border bg-site-canvas px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-site-focus/30" aria-invalid={Boolean(errors.title)} />
        <p className="mt-2 text-xs text-site-muted">{[...title].length}/200</p>
        {errors.title ? <p className="mt-2 text-sm text-site-danger" role="alert">{errors.title}</p> : null}
      </div>
      <div>
        <label className="block text-sm font-semibold text-site-foreground" htmlFor="community-body">{t("questionBody")}</label>
        <div id="community-body" className="mt-2"><CommunityRichTextEditor value={body} onChange={setBody} placeholder={t("bodyPlaceholder")} error={errors.body} disabled={isSubmitting} /></div>
        <p className="mt-2 text-xs text-site-muted">{t("allowedFormatting")}</p>
      </div>
      {submitError ? <div className="border border-site-danger/50 bg-site-danger/5 px-4 py-3 text-sm text-site-danger" role="alert">{submitError}</div> : null}
      <div className="flex flex-wrap items-center gap-3 border-t border-site-border pt-6">
        <button type="submit" disabled={isSubmitting} className="min-h-11 border border-site-border bg-site-action px-5 text-sm font-semibold text-site-on-action hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? t("saving") : isEditing ? t("saveChanges") : t("submitQuestion")}</button>
        <Link href={isEditing ? "/community/activity" : "/community"} className="min-h-11 px-4 py-3 text-sm font-semibold text-site-muted underline underline-offset-4 hover:text-site-foreground">{t("cancel")}</Link>
      </div>
    </form>
  );
}
