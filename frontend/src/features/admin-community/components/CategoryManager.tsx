"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { useAdminCommunityCategories, useDeleteAdminCategory, useReorderAdminCategories, useSaveAdminCategory } from "../queries";
import type { AdminCategoryInput, AdminCommunityCategory } from "../types";

const emptyInput: AdminCategoryInput = { slug: "", name: { th: "", en: "", de: "" }, description: { th: "", en: "", de: "" }, sort_order: 10, is_active: true };

export function CategoryManager() {
  const t = useTranslations("Admin.community");
  const query = useAdminCommunityCategories();
  const save = useSaveAdminCategory();
  const remove = useDeleteAdminCategory();
  const reorder = useReorderAdminCategories();
  const [editing, setEditing] = useState<AdminCommunityCategory | null>(null);
  const [input, setInput] = useState<AdminCategoryInput>(emptyInput);
  const [message, setMessage] = useState("");
  const categories = query.data ?? [];
  const edit = (category: AdminCommunityCategory) => { setEditing(category); setInput({ slug: category.slug, name: category.name, description: category.description, sort_order: category.sort_order, is_active: category.is_active }); };
  const submit = async () => { setMessage(""); try { await save.mutateAsync({ input, id: editing?.id }); setEditing(null); setInput(emptyInput); } catch { setMessage(t("loadError")); } };
  const deleteCategory = async (category: AdminCommunityCategory) => { const reason = window.prompt(t("categoryDeleteReason")); if (!reason) return; try { await remove.mutateAsync({ id: category.id, reason }); } catch { setMessage(t("loadError")); } };
  const move = async (index: number, delta: -1 | 1) => { const next = [...categories]; const target = index + delta; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; try { await reorder.mutateAsync(next.map((category) => category.id)); } catch { setMessage(t("loadError")); } };
  return <div><AdminPageHeader title={t("categories")} breadcrumbs={[{ label: t("title") }, { label: t("categories") }]} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]"><section className="space-y-3">{categories.map((category, index) => <article key={category.id} className="flex flex-wrap items-center justify-between gap-3 border border-admin-border bg-admin-surface p-4"><div><p className="font-semibold text-admin-foreground">{category.name.en}</p><p className="text-xs text-admin-muted">{category.slug} · {category.is_active ? t("categoryActive") : t("inactive")}</p></div><div className="flex gap-2"><button type="button" disabled={index === 0 || reorder.isPending} onClick={() => void move(index, -1)} className="min-h-11 border border-admin-border px-3 text-sm">↑</button><button type="button" disabled={index === categories.length - 1 || reorder.isPending} onClick={() => void move(index, 1)} className="min-h-11 border border-admin-border px-3 text-sm">↓</button><PermissionGuard resource="community" action="manage_categories"><button type="button" onClick={() => edit(category)} className="min-h-11 border border-admin-border px-3 text-sm">{t("categorySave")}</button><button type="button" onClick={() => void deleteCategory(category)} className="min-h-11 border border-admin-danger px-3 text-sm text-admin-danger">{t("categoryDelete")}</button></PermissionGuard></div></article>)}{categories.length === 0 && !query.isLoading ? <p className="border border-admin-border p-5 text-sm text-admin-muted">{t("empty")}</p> : null}</section><section className="border border-admin-border bg-admin-surface p-5"><h2 className="font-semibold text-admin-foreground">{editing ? t("categorySave") : t("categories")}</h2><div className="mt-4 space-y-3"><label className="block text-sm">{t("categorySlug")}<input value={input.slug} onChange={(event) => setInput({ ...input, slug: event.target.value })} className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3" /></label>{(["th", "en", "de"] as const).map((locale) => <label key={locale} className="block text-sm">{t(`category${locale === "th" ? "Th" : locale === "en" ? "En" : "De"}` as "categoryTh")}<input value={input.name[locale]} onChange={(event) => setInput({ ...input, name: { ...input.name, [locale]: event.target.value } })} className="mt-1 min-h-11 w-full border border-admin-border bg-admin-canvas px-3" /></label>)}<label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={input.is_active} onChange={(event) => setInput({ ...input, is_active: event.target.checked })} />{t("categoryActive")}</label><button type="button" disabled={save.isPending} onClick={() => void submit()} className="min-h-11 w-full bg-admin-action px-4 text-sm font-semibold text-admin-on-action disabled:opacity-50">{t("categorySave")}</button>{message ? <p className="text-sm text-admin-danger" role="alert">{message}</p> : null}</div></section></div></div>;
}
