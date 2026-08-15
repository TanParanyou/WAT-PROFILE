"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { calendarResourceAdminService } from "@/services/adminService";
import type { CalendarResourceEntity } from "@/types/entities";
import { calendarResourceSchema, type CalendarResourceFormData } from "@/schemas/calendar-resource.schema";
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";
import { isResourceDeletionDisabled } from "@/features/calendar/resource-manager-contract";

export { isResourceDeletionDisabled } from "@/features/calendar/resource-manager-contract";

const emptyResource: CalendarResourceFormData = {
  slug: "",
  resource_type: "",
  title: { th: "", en: "", de: "" },
  color: null,
  capacity: null,
  metadata: {},
  is_active: true,
  is_public: false,
  display_order: 0,
};

export function CalendarResourceManager() {
  const t = useTranslations("Admin.calendarResources");
  const localeValue = useLocale();
  const locale = localeValue === "de" || localeValue === "en" ? localeValue : "th";
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const resourcesQuery = useQuery({
    queryKey: ["admin", "calendar-resources"],
    queryFn: () => calendarResourceAdminService.getAll(),
  });
  const form = useForm<CalendarResourceFormData>({
    resolver: zodResolver(calendarResourceSchema),
    defaultValues: emptyResource,
  });
  const saveMutation = useMutation({
    mutationFn: async (data: CalendarResourceFormData) => {
      const payload = { ...data, color: data.color || null };
      return editingId === null
        ? calendarResourceAdminService.create(payload)
        : calendarResourceAdminService.update(editingId, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "calendar-resources"] });
      form.reset(emptyResource);
      setEditingId(null);
      toast.success(t("messages.saved"));
    },
    onError: () => toast.error(t("messages.saveError")),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => calendarResourceAdminService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "calendar-resources"] });
      toast.success(t("messages.deleted"));
    },
    onError: () => toast.error(t("messages.deleteError")),
  });

  const confirmDelete = async (resource: CalendarResourceEntity) => {
    await confirm({
      title: t("messages.deleteTitle"),
      message: t("messages.deleteConfirm"),
      variant: "danger",
      onConfirm: () => deleteMutation.mutateAsync(resource.id),
    });
  };

  const resources = resourcesQuery.data?.data ?? [];
  const startEdit = (resource: CalendarResourceEntity) => {
    setEditingId(resource.id);
    form.reset({
      slug: resource.slug,
      resource_type: resource.resource_type,
      title: resource.title,
      color: resource.color,
      capacity: resource.capacity,
      metadata: resource.metadata,
      is_active: resource.is_active,
      is_public: resource.is_public,
      display_order: resource.display_order,
    });
  };

  return (
    <main className="admin-theme min-h-full bg-admin-canvas px-4 py-6 text-admin-foreground sm:px-6 lg:px-8">
      <AdminPageHeader title={t("title")} breadcrumbs={[{ label: t("breadcrumb") }]} />
      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,28rem)_1fr]">
        <section className="border border-admin-border bg-admin-surface p-5">
          <h2 className="mb-4 text-base font-semibold">{editingId === null ? t("form.createTitle") : t("form.editTitle")}</h2>
          <form className="space-y-4" onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}>
            <Input id="calendar-resource-slug" label={t("form.slug")} required {...form.register("slug")} error={form.formState.errors.slug?.message} />
            <Input id="calendar-resource-type" label={t("form.type")} required {...form.register("resource_type")} error={form.formState.errors.resource_type?.message} />
            <Controller control={form.control} name="title" render={({ field }) => <MultiLangInput label={t("form.title")} value={field.value} onChange={field.onChange} required error={form.formState.errors.title?.th?.message} />} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="calendar-resource-color" label={t("form.color")} type="text" placeholder={t("form.colorPlaceholder")} {...form.register("color")} error={form.formState.errors.color?.message} />
              <Input id="calendar-resource-capacity" label={t("form.capacity")} type="number" min={1} {...form.register("capacity", { setValueAs: (value: unknown) => value === "" ? null : Number(value) })} error={form.formState.errors.capacity?.message} />
            </div>
            <Input id="calendar-resource-order" label={t("form.order")} type="number" min={0} {...form.register("display_order", { setValueAs: (value: unknown) => value === "" ? 0 : Number(value) })} error={form.formState.errors.display_order?.message} />
            <div className="space-y-2">
              <Controller control={form.control} name="is_active" render={({ field }) => <Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} label={t("form.active")} />} />
              <Controller control={form.control} name="is_public" render={({ field }) => <Checkbox checked={field.value} onChange={(event) => field.onChange(event.target.checked)} label={t("form.public")} />} />
            </div>
            <div className="flex flex-wrap gap-2">
              <PermissionGuard resource="calendar_resources" action={editingId === null ? "create" : "update"}>
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? t("form.saving") : t("form.save")}</Button>
              </PermissionGuard>
              {editingId !== null ? <Button type="button" variant="outline" onClick={() => { form.reset(emptyResource); setEditingId(null); }}>{t("form.cancel")}</Button> : null}
            </div>
          </form>
        </section>

        <section className="border border-admin-border bg-admin-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{t("list.title")}</h2>
            {resourcesQuery.isFetching ? <span className="text-xs text-admin-muted">{t("list.loading")}</span> : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-admin-border text-xs text-admin-muted"><tr><th className="px-3 py-2">{t("list.resource")}</th><th className="px-3 py-2">{t("list.type")}</th><th className="px-3 py-2">{t("list.visibility")}</th><th className="px-3 py-2">{t("list.assignments")}</th><th className="px-3 py-2">{t("list.actions")}</th></tr></thead>
              <tbody className="divide-y divide-admin-border">
                {resources.map((resource) => (
                  <tr key={resource.id}>
                    <td className="px-3 py-3"><div className="font-medium">{resource.title[locale]}</div><div className="text-xs text-admin-muted">{resource.slug}</div></td>
                    <td className="px-3 py-3">{resource.resource_type}</td>
                    <td className="px-3 py-3">{resource.is_public ? t("list.public") : t("list.private")}</td>
                    <td className="px-3 py-3">{resource.assignment_count}</td>
                    <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><PermissionGuard resource="calendar_resources" action="update"><Button type="button" variant="outline" onClick={() => startEdit(resource)}>{t("list.edit")}</Button></PermissionGuard><PermissionGuard resource="calendar_resources" action="delete"><Button type="button" variant="outline" disabled={isResourceDeletionDisabled(resource) || deleteMutation.isPending} title={isResourceDeletionDisabled(resource) ? t("list.assigned") : undefined} onClick={() => void confirmDelete(resource)}>{t("list.delete")}</Button></PermissionGuard></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!resourcesQuery.isFetching && resources.length === 0 ? <p className="p-4 text-sm text-admin-muted">{t("list.empty")}</p> : null}
          </div>
        </section>
      </div>
      <ConfirmDialog />
    </main>
  );
}
