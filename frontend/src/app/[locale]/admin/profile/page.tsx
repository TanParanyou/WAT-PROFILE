"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { User, Shield, Key, Save, CheckCircle2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImageInputPreview } from "@/components/admin/ImageInputPreview";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export default function ProfilePage() {
  const t = useTranslations("Admin");
  const { user, isLoading: isAuthLoading, updateProfile } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatar_url || "");
    }
  }, [user]);

  if (isAuthLoading) {
    return <PageLoading />;
  }

  const validate = () => {
    const errs: typeof errors = {};

    if (!name.trim()) {
      errs.name = t("profile.nameRequired");
    }

    if (!email.trim()) {
      errs.email = t("profile.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = t("profile.invalidEmail");
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        errs.currentPassword = t("profile.currentPasswordRequired");
      }
      if (!newPassword) {
        errs.newPassword = t("profile.passwordTooShort");
      } else if (newPassword.length < 8) {
        errs.newPassword = t("profile.passwordTooShort");
      }
      if (newPassword !== confirmPassword) {
        errs.confirmPassword = t("profile.passwordMismatch");
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        avatar_url: avatarUrl.trim(),
        ...(newPassword
          ? {
              current_password: currentPassword,
              new_password: newPassword,
            }
          : {}),
      });

      toast.success(t("profile.updateSuccess"));
      setIsSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrors({});
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(errorMsg || t("profile.updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminPageHeader
        title={t("profile.title")}
        breadcrumbs={[{ label: t("profile.title") }]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information Card */}
        <div className="bg-admin-surface border border-admin-border p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-admin-border">
            <div className="h-10 w-10 rounded-full bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-foreground">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-admin-foreground">
                {t("profile.generalInfo")}
              </h2>
              <p className="text-xs text-admin-muted">
                {t("profile.subtitle")}
              </p>
            </div>
          </div>

          {/* Profile Avatar Input with live preview and inline actions */}
          <div>
            <ImageInputPreview
              label={t("profile.avatar")}
              description={t("profile.avatarHelper")}
              value={avatarUrl}
              onChange={setAvatarUrl}
              variant="avatar"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="name"
              label={t("profile.name")}
              placeholder={t("profile.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
            />

            <Input
              id="email"
              type="email"
              label={t("profile.email")}
              placeholder={t("profile.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />
          </div>

          {/* Role & Status (Read-only) */}
          <div className="pt-2">
            <label className="text-sm font-medium text-admin-body flex items-center mb-2">
              <Shield size={16} className="mr-1.5 text-admin-muted" />
              {t("profile.role")}
            </label>
            <div className="flex flex-wrap items-center gap-3 bg-admin-surface-muted border border-admin-border p-3.5 rounded">
              <div className="flex items-center gap-2">
                <span className="font-medium text-admin-foreground">
                  {user?.role?.name || "-"}
                </span>
                {user?.role?.description && (
                  <span className="text-xs text-admin-muted">
                    ({user.role.description})
                  </span>
                )}
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-admin-action/10 text-admin-action ml-auto">
                {user?.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Password Card */}
        <div className="bg-admin-surface border border-admin-border p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-admin-border">
            <div className="h-10 w-10 rounded-full bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-foreground">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-admin-foreground">
                {t("profile.security")}
              </h2>
              <p className="text-xs text-admin-muted">
                {t("profile.passwordLeaveBlank")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              id="current-password"
              type="password"
              label={t("profile.currentPassword")}
              placeholder={t("profile.currentPasswordPlaceholder")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              error={errors.currentPassword}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="new-password"
                type="password"
                label={t("profile.newPassword")}
                placeholder={t("profile.newPasswordPlaceholder")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={errors.newPassword}
              />

              <Input
                id="confirm-password"
                type="password"
                label={t("profile.confirmPassword")}
                placeholder={t("profile.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {isSuccess ? (
            <div className="flex items-center gap-2 text-sm text-admin-action">
              <CheckCircle2 size={16} />
              <span>{t("profile.updateSuccess")}</span>
            </div>
          ) : (
            <div />
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Save size={16} />}
          >
            {t("actions.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
