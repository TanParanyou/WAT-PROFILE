"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PageContainer from "@/components/layout/PageContainer";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { useGuestRegistrationQuery } from "../queries";
import { managementTokenFromHash } from "../form-state";
import { RegistrationManageForm } from "./RegistrationManageForm";
import { getLocalizedText } from "@/features/public/events/mappers";

export function RegistrationManageContent() {
  const t = useTranslations("EventRegistration");
  const locale = useLocale();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const read = () => setToken(managementTokenFromHash(window.location.hash));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const query = useGuestRegistrationQuery(token ?? "");
  if (!token) return <PageContainer width="content"><div className="border border-site-border bg-site-surface p-6"><h1 className="font-heading text-2xl font-semibold text-site-foreground">{t("manageTitle")}</h1><p className="mt-2 text-sm text-site-body">{t("manageTokenMissing")}</p></div></PageContainer>;
  if (query.isLoading) return <PageContainer width="content"><p className="py-16 text-site-muted">{t("loading")}</p></PageContainer>;
  if (query.isError || !query.data) return <PageContainer width="content"><QueryErrorState title={t("manageErrorTitle")} description={t("manageErrorDescription")} retryLabel={t("retry")} onRetry={() => query.refetch()} isRetrying={query.isFetching} /></PageContainer>;
  return <PageContainer width="content"><div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-site-accent">{t("manageTitle")}</p><h1 className="mt-2 font-heading text-3xl font-semibold text-site-foreground">{getLocalizedText(query.data.event.title, locale)}</h1><p className="mt-2 text-sm text-site-body">{t("manageDescription")}</p><div className="mt-8 border border-site-border bg-site-canvas p-5 sm:p-8"><RegistrationManageForm token={token} registration={query.data} /></div></div></PageContainer>;
}
