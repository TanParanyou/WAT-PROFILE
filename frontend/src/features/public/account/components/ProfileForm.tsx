"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link } from "@/navigation";
import { Loader2, AlertCircle, CheckCircle, LogOut } from "lucide-react";
import {
  useAccountSession,
} from "@/features/public/account/AccountSessionProvider";
import {
  useUpdateAccountProfile,
  useCloseAccount,
} from "@/features/public/account/queries";
import { toAccountApiError } from "@/features/public/account/api";
import { validateDisplayName } from "@/features/public/account/validation";
import type { AccountLocale } from "@/features/public/account/types";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const labelBase = "block text-sm font-semibold text-text-800";
const locales = ["th", "en", "de"] as const;

export function ProfileForm() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const { account, logout } = useAccountSession();
  const updateProfile = useUpdateAccountProfile();
  const closeAccount = useCloseAccount();
  const [displayName, setDisplayName] = useState(account?.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(account?.avatar_url ?? "");
  const [preferredLocale, setPreferredLocale] = useState<AccountLocale>(account?.preferred_locale ?? (locale as AccountLocale));
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closePassword, setClosePassword] = useState("");
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  if (!account) return null;

  const isClosed = account.account_status === "closed";
  const isDisabled = account.account_status === "disabled";

  if (isClosed) {
    return (
      <div
        role="status"
        className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{t("account.closedTitle")}</p>
          <p className="mt-1">{t("account.closedBody")}</p>
        </div>
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div
        role="status"
        className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{t("account.disabledTitle")}</p>
          <p className="mt-1">{t("account.disabledBody")}</p>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaved(false);

    const nameError = validateDisplayName(displayName);
    if (nameError) {
      setFormError(t(`validation.${nameError}`));
      return;
    }
    if (avatarUrl && !/^https?:\/\/.+/.test(avatarUrl)) {
      setFormError(t("validation.avatarUrlInvalid"));
      return;
    }

    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim(),
        preferred_locale: preferredLocale,
      });
      setSaved(true);
    } catch (err) {
      const apiError = toAccountApiError(err);
      setFormError(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!closePassword) {
      setFormError(t("validation.passwordCurrentRequired"));
      return;
    }
    setClosing(true);
    try {
      await closeAccount.mutateAsync(closePassword);
    } catch (err) {
      setFormError(toAccountApiError(err).message);
      setClosing(false);
    }
  };

  return (
    <div className="space-y-8">
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}
      {saved && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{t("account.saved")}</span>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-site-foreground">{t("account.title")}</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-text-800">{t("account.emailLabel")}</dt>
            <dd className="text-site-muted">{account.email}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-800">{t("account.statusLabel")}</dt>
            <dd className="text-site-muted">{t(`account.status${capitalize(account.account_status)}`)}</dd>
          </div>
        </dl>
      </section>

      <form className="space-y-5" onSubmit={handleSave} noValidate>
        <div>
          <label className={labelBase} htmlFor="profile-display-name">
            {t("account.displayNameLabel")}
          </label>
          <input
            id="profile-display-name"
            name="display_name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase} htmlFor="profile-avatar-url">
            {t("account.avatarUrlLabel")}
          </label>
          <input
            id="profile-avatar-url"
            name="avatar_url"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder={t("account.avatarUrlPlaceholder")}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase} htmlFor="profile-locale">
            {t("account.localeLabel")}
          </label>
          <select
            id="profile-locale"
            name="preferred_locale"
            value={preferredLocale}
            onChange={(e) => setPreferredLocale(e.target.value as AccountLocale)}
            className={inputBase}
          >
            {locales.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {t("account.save")}
        </button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/account/sessions"
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
        >
          {t("account.sessionsLink")}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
        >
          <LogOut className="h-5 w-5" aria-hidden />
          {t("account.logout")}
        </button>
      </div>

      <section className="space-y-4 border-t border-site-border pt-6">
        <h2 className="font-heading text-lg font-bold text-site-foreground">{t("account.closeLabel")}</h2>
        <p className="text-sm text-site-muted">{t("account.closeIntro")}</p>
        {!confirmClose ? (
          <button
            type="button"
            onClick={() => setConfirmClose(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-red-700 bg-site-canvas px-6 py-[13px] font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
          >
            {t("account.closeButton")}
          </button>
        ) : (
          <form className="space-y-4" onSubmit={handleClose} noValidate>
            <p className="text-sm text-site-muted">{t("account.closeConfirm")}</p>
            <div>
              <label className={labelBase} htmlFor="close-password">
                {t("account.closePasswordLabel")}
              </label>
              <input
                id="close-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={closePassword}
                onChange={(e) => setClosePassword(e.target.value)}
                className={inputBase}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={closing}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-red-700 px-6 py-[13px] font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
              >
                {closing && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
                {t("account.closeConfirm")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClose(false)}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
              >
                {t("account.logout")}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
