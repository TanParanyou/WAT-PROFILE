"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { userAdminService, roleAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import { useApiError } from "@/hooks/useApiError";
import { ToastContainer } from "@/components/admin/Toast";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserSchema,
  type UpdateUserFormData,
} from "@/schemas/user.schema";

export default function EditUserPage({ params }: { params: { id: string } }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const { toasts, toast, removeToast } = useToast();
  const { handleApiError } = useApiError();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    const loadVars = async () => {
      try {
        const rolesRes = await roleAdminService.getAll();
        const options = rolesRes.data.map((r) => ({
          value: r.id,
          label: r.name,
        }));
        setRoles([{ value: "", label: "Select a role..." }, ...options]);

        const user = await userAdminService.getById(params.id);
        reset({
          name: user.name,
          email: user.email,
          password: "",
          role_id: user.role_id || "",
          is_active: user.is_active,
        });
      } catch (err: unknown) {
        handleApiError(err);
      } finally {
        setIsFetching(false);
      }
    };
    loadVars();
  }, [params.id, toast, t, reset, handleApiError]);

  const onSubmit = async (data: UpdateUserFormData) => {
    setIsLoading(true);
    try {
      await userAdminService.update(params.id, {
        ...data,
        role_id: data.role_id || null,
        ...(data.password ? { password: data.password } : {}),
      });
      toast.success(t("common.success"));
      router.push("/admin/users");
    } catch (err: unknown) {
      handleApiError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-center">{t("common.loading")}</div>;
  }

  return (
    <div>
      <AdminPageHeader
        title={t("users.edit")}
        breadcrumbs={[
          { label: t("users.title"), href: "/admin/users" },
          { label: t("common.edit") },
        ]}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl bg-white rounded-xl border border-gray-200 p-6 space-y-4"
      >
        <Input
          id="name"
          label="ชื่อ-นามสกุล"
          {...register("name")}
          error={errors.name?.message}
        />
        <Input
          id="email"
          label="อีเมล"
          type="email"
          {...register("email")}
          error={errors.email?.message}
        />
        <Input
          id="password"
          label="รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
        <Controller
          control={control}
          name="role_id"
          render={({ field }) => (
            <Select
              id="role_id"
              label="บทบาท (Role)"
              options={roles}
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              error={errors.role_id?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Checkbox
              id="is_active"
              label="เปิดใช้งาน"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/users")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {t("common.save")}
          </Button>
        </div>
      </form>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
