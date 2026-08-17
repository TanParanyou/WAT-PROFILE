"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { userAdminService, roleAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import { useTranslations } from "next-intl";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  updateUserSchema,
  type UpdateUserFormData,
} from "@/schemas/user.schema";
import { ArrowLeft } from "lucide-react";
import { FormActionBar } from "@/components/admin/FormActionBar";

interface UserEditorProps {
  id?: string;
}

export function UserEditor({ id }: UserEditorProps) {
  const isEditMode = !!id;
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);

  const methods = useForm<UpdateUserFormData>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role_id: "",
      is_active: true,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = methods;

  // Fetch roles and user data if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        const rolesRes = await roleAdminService.getAll();
        const options = rolesRes.data.map((r) => ({
          value: String(r.id),
          label: r.name,
        }));
        setRoles([{ value: "", label: t("users.form.selectRole") }, ...options]);

        if (id) {
          const user = await userAdminService.getById(id);
          reset({
            name: user.name,
            email: user.email,
            password: "",
            role_id: user.role_id ? String(user.role_id) : "",
            is_active: user.is_active,
          });
        }
      } catch (err: unknown) {
        handleApiError(err);
      } finally {
        setIsFetching(false);
      }
    };
    loadData();
  }, [id, reset, handleApiError, t]);

  const onSubmit = async (data: UpdateUserFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        role_id: data.role_id ? Number(data.role_id) : null,
        ...(isEditMode && !data.password ? {} : { password: data.password }),
      };

      if (isEditMode && id) {
        await userAdminService.update(
          id,
          payload as unknown as Record<string, unknown>,
        );
      } else {
        await userAdminService.create(
          payload as unknown as Record<string, unknown>,
        );
      }
      toast.success(t("common.success"));
      router.push("/admin/users");
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <PageLoading />;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-[calc(100vh-7rem)] flex flex-col justify-between"
      >
        <div className="space-y-6 flex-1 mb-8">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-admin-muted mb-1">
                <button
                  type="button"
                  onClick={() => router.push("/admin/users")}
                  className="hover:text-admin-foreground flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-admin-focus rounded"
                >
                  <ArrowLeft size={14} />
                  {t("common.back")}
                </button>
              </div>
              <h1 className="text-xl font-semibold text-admin-foreground">
                {isEditMode ? t("users.edit") : t("users.create")}
              </h1>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-admin-surface rounded-none border border-admin-border p-6 space-y-4 max-w-2xl">
            <Input
              id="name"
              label={`${t("users.form.name")} *`}
              placeholder={t("users.form.namePlaceholder")}
              {...register("name")}
              error={errors.name?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="email"
                label={`${t("users.form.email")} *`}
                type="email"
                placeholder={t("users.form.emailPlaceholder")}
                {...register("email")}
                error={errors.email?.message}
              />
              <Controller
                control={control}
                name="role_id"
                render={({ field }) => (
                  <Select
                    id="role_id"
                    label={t("users.form.role")}
                    options={roles}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.role_id?.message}
                  />
                )}
              />
            </div>

            <Input
              id="password"
              label={
                isEditMode
                  ? t("users.form.newPasswordOptional")
                  : `${t("users.form.password")} *`
              }
              type="password"
              placeholder={
                isEditMode ? "••••••••" : t("users.form.passwordPlaceholder")
              }
              {...register("password")}
              error={errors.password?.message}
            />

            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch
                  id="user-is-active"
                  label={t("users.form.active")}
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </div>

        {/* Sticky Action Bar */}
        <FormActionBar
          isDirty={isDirty}
          isLoading={isLoading}
          isEditMode={isEditMode}
          onCancel={() => router.push("/admin/users")}
        />
      </form>
    </FormProvider>
  );
}
