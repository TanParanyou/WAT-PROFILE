"use client";

import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import PageContainer from "@/components/layout/PageContainer";
import { QueryErrorState } from "@/components/public/states/QueryErrorState";
import { EmptyState } from "@/components/public/states/EmptyState";
import { usePublicEventQuery } from "@/features/public/events/queries";
import { getLocalizedText } from "@/features/public/events/mappers";
import { RegistrationForm } from "./RegistrationForm";

export function RegistrationPageContent({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations("EventRegistration");
  const state = usePublicEventQuery(slug);
  if (state.isLoading) return <PageContainer width="content"><div className="py-16 text-site-muted">{t("loading")}</div></PageContainer>;
  if (state.isError) return <PageContainer width="content"><QueryErrorState title={t("loadErrorTitle")} description={t("loadErrorDescription")} retryLabel={t("retry")} onRetry={() => state.refetch()} isRetrying={state.isFetching} /></PageContainer>;
  if (!state.data) return <PageContainer width="content"><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} /></PageContainer>;
  const event = state.data;
  const title = getLocalizedText(event.title, locale);
  return <PageContainer width="content">
    <Link href={`/events/${slug}`} className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-site-foreground underline underline-offset-4"><ArrowLeft size={16} aria-hidden="true" />{t("backToEvent")}</Link>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="border border-site-border bg-site-canvas p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-site-accent">{t("eyebrow")}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-site-foreground">{title}</h1>
        <p className="mt-2 text-sm text-site-body">{t("intro")}</p>
        <div className="mt-7"><RegistrationForm eventId={event.id} availability={event.registration} /></div>
      </section>
      <aside className="h-fit border border-site-border bg-site-surface p-5 text-sm text-site-body">
        <h2 className="font-semibold text-site-foreground">{t("privacyTitle")}</h2>
        <p className="mt-2 leading-6">{t("privacyDescription")}</p>
      </aside>
    </div>
  </PageContainer>;
}
