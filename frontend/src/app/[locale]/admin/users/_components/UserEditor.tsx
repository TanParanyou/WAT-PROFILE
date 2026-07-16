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
import { Save, ArrowLeft } from "lucide-react";

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
        setRoles([{ value: "", label: "Select a role..." }, ...options]);

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
  }, [id, reset, handleApiError]);

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
          <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1">
                <button
                  type="button"
                  onClick={() => router.push("/admin/users")}
                  className="hover:text-zinc-950 flex items-center gap-1"
                >
                  <ArrowLeft size={14} />
                  ย้อนกลับ
                </button>
              </div>
              <h1 className="text-xl font-semibold text-zinc-950">
                {isEditMode ? t("users.edit") : t("users.create")}
              </h1>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4 max-w-2xl">
            <Input
              id="name"
              label="ชื่อ-นามสกุล *"
              placeholder="กรอกชื่อและนามสกุล"
              {...register("name")}
              error={errors.name?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="email"
                label="อีเมล *"
                type="email"
                placeholder="example@email.com"
                {...register("email")}
                error={errors.email?.message}
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
            </div>

            <Input
              id="password"
              label={
                isEditMode
                  ? "รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)"
                  : "รหัสผ่าน *"
              }
              type="password"
              placeholder={
                isEditMode ? "••••••••" : "กรอกรหัสผ่านอย่างน้อย 8 ตัวอักษร"
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
                  label="เปิดใช้งานผู้ใช้งาน"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="sticky bottom-0 z-40 -mx-4 -mb-4 mt-8 flex items-center justify-between border-t border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:-mb-6 sm:px-6">
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
                มีข้อมูลที่ยังไม่ได้เซฟ
              </span>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/users")}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              icon={<Save size={16} />}
              className="w-full sm:w-auto shadow-sm"
            >
              {isEditMode ? t("common.saveChanges") : t("common.save")}
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
