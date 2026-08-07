"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, LogOut } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAccountSession } from "@/features/public/account/AccountSessionProvider";
import {
  useUpdateAccountProfile,
  useCloseAccount,
} from "@/features/public/account/queries";
import { toAccountApiError } from "@/features/public/account/api";
import { useAccountReauth } from "@/features/public/account/hooks/useAccountReauth";
import { AccountReauthError } from "@/features/public/account/reauth/reauth-types";
import { AccountProviderMethods } from "./AccountProviderMethods";
import { CredentialForms } from "./CredentialForms";
import { AvatarUpload } from "./AvatarUpload";
import { AccountField } from "./AccountField";
import { AccountTabs, type AccountTab } from "./AccountTabs";
import { buildAccountHref, parseAccountTab } from "../accountNavigation";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import {
  createAccountFormSchemas,
  type ProfileFormValues,
} from "@/features/public/account/formSchemas";
import { mapAccountFormError } from "@/features/public/account/formErrors";
import type { AccountLocale } from "@/features/public/account/types";

const inputBase =
  "mt-2 min-h-11 w-full border border-site-border bg-site-canvas px-3 py-2.5 text-base text-site-foreground outline-none transition-colors placeholder:text-site-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-site-focus";
const primaryActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 bg-site-action px-6 py-[13px] font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus sm:w-auto";
const secondaryActionClass =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus sm:w-auto";
const locales = ["th", "en", "de"] as const satisfies readonly AccountLocale[];

export function ProfileForm() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = parseAccountTab(searchParams.get("tab"));
  const {
    status,
    account,
    accountLoading,
    accountError,
    sessionEndReason,
    retryAccount,
    logout,
    clearLocalSession,
  } = useAccountSession();
  const { requireRecentAuth } = useAccountReauth();
  const updateProfile = useUpdateAccountProfile();
  const closeAccount = useCloseAccount();
  const [saved, setSaved] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closedPurgeAfter, setClosedPurgeAfter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AccountTab>(() => requestedTab);
  const [initializedAccountId, setInitializedAccountId] = useState<
    string | null
  >(null);
  const [panelHeadingRefs] = useState(() => ({
    profile: null as HTMLHeadingElement | null,
    preferences: null as HTMLHeadingElement | null,
    security: null as HTMLHeadingElement | null,
  }));
  const localeLabels: Record<AccountLocale, string> = {
    th: t("account.localeThai"),
    en: t("account.localeEnglish"),
    de: t("account.localeGerman"),
  };

  const accountLocale: AccountLocale =
    locale === "th" || locale === "en" || locale === "de" ? locale : "en";
  const schemas = useMemo(
    () =>
      createAccountFormSchemas({
        emailRequired: t("validation.emailRequired"),
        emailInvalid: t("validation.emailInvalid"),
        displayNameRequired: t("validation.displayNameRequired"),
        displayNameMin: t("validation.displayNameMin"),
        displayNameMax: t("validation.displayNameMax"),
        passwordRequired: t("validation.passwordRequired"),
        passwordMin: t("validation.passwordMin"),
        passwordMax: t("validation.passwordMax"),
        passwordComplexity: t("validation.passwordComplexity"),
      }),
    [t],
  );
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(schemas.profile),
    defaultValues: {
      displayName: "",
      preferredLocale: accountLocale,
    },
    shouldFocusError: true,
  });
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  useEffect(() => {
    if (!account) {
      setInitializedAccountId(null);
      reset({ displayName: "", preferredLocale: accountLocale });
      return;
    }
    if (account.id === initializedAccountId) return;

    reset({
      displayName: account.display_name,
      preferredLocale: account.preferred_locale,
    });
    setActiveTab(requestedTab);
    clearErrors();
    setSaved(false);
    setInitializedAccountId(account.id);
  }, [account, accountLocale, clearErrors, initializedAccountId, requestedTab, reset]);

  useEffect(() => {
    if (!account || account.id !== initializedAccountId) return;
    setActiveTab(requestedTab);
  }, [account, initializedAccountId, requestedTab]);

  const { confirmNavigation } = useUnsavedChanges({
    isDirty,
    message: t("account.unsavedBody"),
  });

  if (closedPurgeAfter) {
    return (
      <div
        role="status"
        className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">{t("account.closedTitle")}</p>
          <p className="mt-1">{t("account.closedBody")}</p>
          <p className="mt-1">
            {t("account.closedPurgeBody", {
              date: new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
              }).format(new Date(closedPurgeAfter)),
            })}
          </p>
          <Link
            href="/account/reopen-request"
            className="mt-3 inline-block font-semibold underline"
          >
            {t("account.closedReopenLink")}
          </Link>
        </div>
      </div>
    );
  }

  if (status === "loading" || (status === "authenticated" && accountLoading)) {
    return (
      <div role="status" aria-live="polite" className="text-sm text-site-muted">
        {t("account.loading")}
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <section aria-labelledby="account-access-title" className="space-y-4">
        {sessionEndReason ? (
          <div role="alert" className="border border-red-700 bg-red-50 p-3 text-sm text-red-700">
            {t(
              sessionEndReason === "disabled"
                ? "account.sessionDisabled"
                : "account.sessionExpired",
            )}
          </div>
        ) : null}
        <div>
          <h2
            id="account-access-title"
            className="font-heading text-xl font-bold text-site-foreground"
          >
            {t("account.accessTitle")}
          </h2>
          <p className="mt-2 text-sm text-site-muted">
            {t("account.accessBody")}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/account/login" className={primaryActionClass}>
            {t("account.loginAction")}
          </Link>
          <Link href="/account/register" className={secondaryActionClass}>
            {t("account.registerAction")}
          </Link>
        </div>
      </section>
    );
  }

  if (!account) {
    return (
      <div className="space-y-4">
        <div
          role={accountError ? "alert" : "status"}
          aria-live={accountError ? undefined : "polite"}
          className="border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          {t("account.loadError")}
        </div>
        <button
          type="button"
          onClick={() => void retryAccount()}
          className={primaryActionClass}
        >
          {t("account.retry")}
        </button>
      </div>
    );
  }

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
          {account.purge_after && (
            <p className="mt-1">
              {t("account.closedPurgeBody", {
                date: new Intl.DateTimeFormat(locale, {
                  dateStyle: "long",
                }).format(new Date(account.purge_after)),
              })}
            </p>
          )}
          <Link
            href="/account/reopen-request"
            className="mt-3 inline-block font-semibold underline"
          >
            {t("account.closedReopenLink")}
          </Link>
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

  const saveProfile = handleSubmit(async (values) => {
    clearErrors("root.server");
    setSaved(false);
    try {
      const updated = await updateProfile.mutateAsync({
        display_name: values.displayName,
        avatar_url: account.avatar_url,
        preferred_locale: values.preferredLocale,
      });
      reset({
        displayName: updated.display_name,
        preferredLocale: updated.preferred_locale,
      });
      setSaved(true);
      if (values.preferredLocale !== locale) {
        router.replace(buildAccountHref(activeTab), {
          locale: values.preferredLocale,
          scroll: false,
        });
      }
    } catch (error: unknown) {
      const apiError = toAccountApiError(error);
      const mapped = mapAccountFormError(apiError, {
        display_name: "displayName",
        locale: "preferredLocale",
        preferred_locale: "preferredLocale",
      });
      const message = t(mapped.messageKey as Parameters<typeof t>[0]);
      if (
        mapped.target === "displayName" ||
        mapped.target === "preferredLocale"
      ) {
        setError(mapped.target, { type: "server", message });
      } else {
        setError("root.server", { type: "server", message });
      }
    }
  });

  const handleDiscard = () => {
    reset();
    clearErrors();
    setSaved(false);
  };

  const handleTabChange = (tab: AccountTab): boolean => {
    if (tab === activeTab) return true;
    if (!confirmNavigation()) return false;
    setActiveTab(tab);
    router.replace(buildAccountHref(tab), { scroll: false });
    requestAnimationFrame(() => panelHeadingRefs[tab]?.focus());
    return true;
  };

  const handleLogout = async () => {
    if (!confirmNavigation()) return;
    await logout();
  };

  const handleClose = async () => {
    clearErrors("root.server");
    setClosing(true);
    try {
      await requireRecentAuth({ reason: "close_account" });
      const result = await closeAccount.mutateAsync();
      setClosedPurgeAfter(result.purge_after);
      setConfirmClose(false);
      reset({ displayName: "", preferredLocale: accountLocale });
      clearErrors();
      setSaved(false);
      closeAccount.reset();
      clearLocalSession();
    } catch (err) {
      if (
        err instanceof AccountReauthError &&
        err.code === "AUTH_REAUTH_CANCELLED"
      )
        return;
      const apiError = toAccountApiError(err);
      setError("root.server", {
        type: "server",
        message: t(`errors.${apiError.code}` as Parameters<typeof t>[0]),
      });
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-8">
      {errors.root?.server?.message && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span>{errors.root.server.message}</span>
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

      <AccountTabs
        activeTab={activeTab}
        onChange={handleTabChange}
        isDirty={isDirty}
      />

      <div className="grid items-start">
        <form
          className={`col-start-1 row-start-1 space-y-5 ${tabPanelVisibilityClass(activeTab, "profile")}`}
          onSubmit={saveProfile}
          aria-hidden={activeTab !== "profile"}
          noValidate
        >
          <section
            id="account-tabpanel-profile"
            role="tabpanel"
            aria-labelledby="account-tab-profile"
            tabIndex={0}
            className="space-y-5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
          >
            <div>
              <h2
                id="account-panel-profile-heading"
                ref={(element) => {
                  panelHeadingRefs.profile = element;
                }}
                tabIndex={-1}
                className="font-heading text-xl font-bold text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
              >
                {t("account.profileSection")}
              </h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-text-800">
                    {t("account.emailLabel")}
                  </dt>
                  <dd className="text-site-muted">{account.email}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-text-800">
                    {t("account.statusLabel")}
                  </dt>
                  <dd className="text-site-muted">
                    {t(`account.status${capitalize(account.account_status)}`)}
                  </dd>
                </div>
              </dl>
            </div>
            <AvatarUpload account={account} onUploaded={() => setSaved(true)} />
            <AccountField
              id="profile-display-name"
              label={t("account.displayNameLabel")}
              error={errors.displayName?.message}
            >
              <input
                id="profile-display-name"
                type="text"
                {...register("displayName")}
                className={inputBase}
                aria-invalid={errors.displayName ? true : undefined}
                aria-describedby={
                  errors.displayName ? "profile-display-name-error" : undefined
                }
              />
            </AccountField>
          </section>
        </form>

        <form
          className={`col-start-1 row-start-1 space-y-5 ${tabPanelVisibilityClass(activeTab, "preferences")}`}
          onSubmit={saveProfile}
          aria-hidden={activeTab !== "preferences"}
          noValidate
        >
          <section
            id="account-tabpanel-preferences"
            role="tabpanel"
            aria-labelledby="account-tab-preferences"
            tabIndex={0}
            className="space-y-5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
          >
            <h2
              id="account-panel-preferences-heading"
              ref={(element) => {
                panelHeadingRefs.preferences = element;
              }}
              tabIndex={-1}
              className="font-heading text-xl font-bold text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
            >
              {t("account.languageSection")}
            </h2>
            <AccountField
              id="profile-locale"
              label={t("account.localeLabel")}
              error={errors.preferredLocale?.message}
            >
              <select
                id="profile-locale"
                {...register("preferredLocale")}
                className={inputBase}
                aria-invalid={errors.preferredLocale ? true : undefined}
                aria-describedby={`profile-locale-description${
                  errors.preferredLocale ? " profile-locale-error" : ""
                }`}
              >
                {locales.map((code) => (
                  <option key={code} value={code}>
                    {localeLabels[code]}
                  </option>
                ))}
              </select>
              <p
                id="profile-locale-description"
                className="mt-2 max-w-prose text-sm leading-6 text-site-muted"
              >
                {t("account.localeDescription")}
              </p>
            </AccountField>
          </section>
        </form>

        <section
          className={`col-start-1 row-start-1 ${tabPanelVisibilityClass(activeTab, "security")}`}
          aria-hidden={activeTab !== "security"}
        >
          <section
            id="account-tabpanel-security"
            role="tabpanel"
            aria-labelledby="account-tab-security"
            tabIndex={0}
            className="space-y-8 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
          >
            <AccountProviderMethods account={account} />
            <CredentialForms />
            <section
              aria-labelledby="account-sessions-title"
              className="space-y-4"
            >
              <div>
                <h2
                  id="account-sessions-title"
                  className="font-heading text-xl font-bold text-site-foreground"
                >
                  {t("account.sessionsSection")}
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/account/sessions"
                  className={secondaryActionClass}
                  onClick={(event) => {
                    if (!confirmNavigation()) event.preventDefault();
                  }}
                >
                  {t("account.sessionsLink")}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className={secondaryActionClass}
                >
                  <LogOut className="h-5 w-5" aria-hidden />
                  {t("account.logout")}
                </button>
              </div>
            </section>

            <section
              aria-labelledby="account-panel-security-heading"
              className="space-y-4 border-t border-site-border pt-6"
            >
              <div>
                <h2
                  id="account-panel-security-heading"
                  ref={(element) => {
                    panelHeadingRefs.security = element;
                  }}
                  tabIndex={-1}
                  className="font-heading text-xl font-bold text-site-foreground focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                  {t("account.securitySection")}
                </h2>
                <h3 className="mt-4 font-semibold text-site-foreground">
                  {t("account.closeLabel")}
                </h3>
                <p className="mt-1 text-sm text-site-muted">
                  {t("account.closeIntro")}
                </p>
              </div>
              {!confirmClose ? (
                <button
                  type="button"
                  onClick={() => setConfirmClose(true)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-red-700 bg-site-canvas px-6 py-[13px] font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
                >
                  {t("account.closeButton")}
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-site-muted">
                    {t("account.closeConfirm")}
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => void handleClose()}
                      disabled={closing}
                      className="inline-flex min-h-11 items-center justify-center gap-2 bg-red-700 px-6 py-[13px] font-semibold text-white transition-colors hover:bg-red-800 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {closing && (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      )}
                      {t("account.closeConfirm")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClose(false)}
                      className={secondaryActionClass}
                    >
                      {t("account.cancel")}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </section>
        </section>
      </div>

      {isDirty ? (
        <div className="flex flex-col gap-4 border border-site-border bg-site-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="font-semibold text-site-foreground">
              {t("account.unsaved")}
            </p>
            <p className="mt-1 text-sm text-site-muted">
              {t("account.unsavedBody")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:shrink-0 sm:flex-row">
            <button
              type="button"
              onClick={handleDiscard}
              className={secondaryActionClass}
            >
              {t("account.discardChanges")}
            </button>
            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={isSubmitting}
              className={`${primaryActionClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isSubmitting && (
                <Loader2
                  className="h-5 w-5 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
              )}
              {t("account.saveAndContinue")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function tabPanelVisibilityClass(
  activeTab: AccountTab,
  tab: AccountTab,
): string {
  return activeTab === tab ? "visible" : "invisible pointer-events-none";
}
