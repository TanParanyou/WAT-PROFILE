"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  Shield,
  Key,
  Save,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Bell,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ImageInputPreview } from "@/components/admin/ImageInputPreview";
import { TwoFactorAuthCard } from "@/components/admin/security/TwoFactorAuthCard";
import { ActiveSessionsCard } from "@/components/admin/security/ActiveSessionsCard";
import { SecurityPreferencesCard } from "@/components/admin/security/SecurityPreferencesCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageLoading } from "@/components/ui/Loading";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

type ProfileTab = "general" | "2fa" | "sessions" | "notifications";

export default function ProfilePage() {
  const t = useTranslations("Admin");
  const { user, isLoading: isAuthLoading, updateProfile } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ProfileTab>("general");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileErrors, setProfileErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isProfileSuccess, setIsProfileSuccess] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false);

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

  const validateProfile = () => {
    const errs: typeof profileErrors = {};

    if (!name.trim()) {
      errs.name = t("profile.nameRequired");
    }

    if (!email.trim()) {
      errs.email = t("profile.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = t("profile.invalidEmail");
    }

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePassword = () => {
    const errs: typeof passwordErrors = {};

    if (!currentPassword) {
      errs.currentPassword = t("profile.currentPasswordRequired");
    }
    if (!newPassword) {
      errs.newPassword = t("profile.passwordTooShort");
    } else if (newPassword.length < 12) {
      errs.newPassword = t("profile.passwordTooShort");
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = t("profile.passwordMismatch");
    }

    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSuccess(false);

    if (!validateProfile()) {
      return;
    }

    setIsProfileSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        avatar_url: avatarUrl.trim(),
      });

      setIsProfileSuccess(true);
      toast.success(t("profile.profileUpdateSuccess"));
      setTimeout(() => setIsProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(errorMsg || t("profile.updateError"));
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPasswordSuccess(false);

    if (!validatePassword()) {
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordSuccess(true);
      toast.success(t("profile.passwordUpdateSuccess"));
      setTimeout(() => setIsPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      toast.error(errorMsg || t("profile.updateError"));
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: "general",
      label: t("profile.tabGeneral"),
      icon: <User size={16} />,
    },
    {
      id: "2fa",
      label: t("profile.tab2FA"),
      icon: <ShieldCheck size={16} />,
      badge: user?.totp_enabled ? (
        <span className="w-2 h-2 rounded-full bg-admin-action shrink-0" />
      ) : null,
    },
    {
      id: "sessions",
      label: t("profile.tabSessions"),
      icon: <Globe size={16} />,
    },
    {
      id: "notifications",
      label: t("profile.tabNotifications"),
      icon: <Bell size={16} />,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AdminPageHeader
        title={t("profile.title")}
        breadcrumbs={[
          { label: t("sidebar.dashboard"), href: "/admin" },
          { label: t("profile.title") },
        ]}
      />

      {/* Tabs Navigation */}
      <div className="border-b border-admin-border bg-admin-surface">
        <div className="flex overflow-x-auto scrollbar-none gap-1 p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap border-b-2 -mb-[1px] ${
                  isActive
                    ? "border-admin-action text-admin-action bg-admin-action/5 font-semibold"
                    : "border-transparent text-admin-muted hover:text-admin-foreground hover:bg-admin-surface-muted"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: General Profile & Password */}
      {activeTab === "general" && (
        <div className="space-y-6">
          {/* Form 1: Personal Info Card */}
          <form onSubmit={handleProfileSubmit} className="bg-admin-surface border border-admin-border p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-admin-border">
              <div className="h-10 w-10 bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-foreground">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-admin-foreground">
                  {t("profile.generalInfo")}
                </h2>
                <p className="text-xs text-admin-muted">{t("profile.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-6">
              <ImageInputPreview
                label={t("profile.avatar")}
                value={avatarUrl}
                onChange={setAvatarUrl}
                variant="avatar"
                description={t("profile.avatarHelper")}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="profile-name"
                  name="name"
                  type="text"
                  label={t("profile.name")}
                  placeholder={t("profile.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={profileErrors.name}
                  autoComplete="name"
                  required
                />

                <Input
                  id="profile-email"
                  name="email"
                  type="email"
                  label={t("profile.email")}
                  placeholder={t("profile.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={profileErrors.email}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Role & Status info */}
              <div className="flex flex-wrap items-center gap-6 p-4 bg-admin-surface-muted border border-admin-border text-xs">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-admin-action" />
                  <span className="text-admin-muted">{t("profile.role")}:</span>
                  <span className="font-semibold text-admin-foreground">
                    {user?.role?.name || "Super Admin"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-admin-muted">Status:</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 font-medium ${
                      user?.is_active
                        ? "bg-admin-action/10 text-admin-action border border-admin-action/20"
                        : "bg-admin-danger/10 text-admin-danger border border-admin-danger/20"
                    }`}
                  >
                    {user?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Actions for Profile Info */}
              <div className="flex items-center justify-between pt-2 border-t border-admin-border">
                {isProfileSuccess ? (
                  <div className="flex items-center gap-2 text-sm text-admin-action font-medium">
                    <CheckCircle2 size={16} />
                    <span>{t("profile.profileUpdateSuccess")}</span>
                  </div>
                ) : (
                  <div />
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isProfileSubmitting}
                  icon={<Save size={16} />}
                >
                  {t("profile.saveProfile")}
                </Button>
              </div>
            </div>
          </form>

          {/* Form 2: Security & Password Card */}
          <form onSubmit={handlePasswordSubmit} className="bg-admin-surface border border-admin-border p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-admin-border">
              <div className="h-10 w-10 bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-foreground">
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
                name="current_password"
                type="password"
                label={t("profile.currentPassword")}
                placeholder={t("profile.currentPasswordPlaceholder")}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="new-password"
                  name="new_password"
                  type="password"
                  label={t("profile.newPassword")}
                  placeholder={t("profile.newPasswordPlaceholder")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={passwordErrors.newPassword}
                  autoComplete="new-password"
                  required
                />

                <Input
                  id="confirm-password"
                  name="confirm_password"
                  type="password"
                  label={t("profile.confirmPassword")}
                  placeholder={t("profile.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={passwordErrors.confirmPassword}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Actions for Password Change */}
              <div className="flex items-center justify-between pt-2 border-t border-admin-border">
                {isPasswordSuccess ? (
                  <div className="flex items-center gap-2 text-sm text-admin-action font-medium">
                    <CheckCircle2 size={16} />
                    <span>{t("profile.passwordUpdateSuccess")}</span>
                  </div>
                ) : (
                  <div />
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isPasswordSubmitting}
                  icon={<Key size={16} />}
                >
                  {t("profile.changePassword")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Two-Factor Authentication */}
      {activeTab === "2fa" && (
        <div className="animate-fade-in">
          <TwoFactorAuthCard />
        </div>
      )}

      {/* Tab 3: Active Sessions */}
      {activeTab === "sessions" && (
        <div className="animate-fade-in">
          <ActiveSessionsCard />
        </div>
      )}

      {/* Tab 4: Security Notifications */}
      {activeTab === "notifications" && (
        <div className="animate-fade-in">
          <SecurityPreferencesCard />
        </div>
      )}
    </div>
  );
}
