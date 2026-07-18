"use client";

import { useLocale, useTranslations } from "next-intl";
import { Building2, Mail, MapPin, Phone, Scale, UserCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { PublicContentStateBoundary } from "@/features/public/content/components/PublicContentStateBoundary";
import { usePublicImpressumQuery } from "@/features/public/content/queries";
import { getLocalizedText } from "@/utils/localizedText";
import { toPublicQueryError } from "@/features/public/shared/query-error";

export default function ImpressumContent() {
  const locale = useLocale();
  const t = useTranslations("ImpressumPage");
  const query = usePublicImpressumQuery();
  const page = query.data;
  const body = page?.body;
  const text = (value: Parameters<typeof getLocalizedText>[0] | undefined) => (value ? getLocalizedText(value, locale) : "");
  const title = page ? text(page.title) || t("title") : t("title");
  const hasData = Boolean(body && [body.organization_name, body.legal_form, body.address, body.phone, body.email, body.representative, body.registry_court, body.registry_number, body.vat_id, body.content_responsibility].some((value) => typeof value === "string" ? value : text(value).length > 0));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PageHeader title={title} />
      <PageContainer>
        <div className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-zinc-900 md:p-12">
          <PublicContentStateBoundary isLoading={query.isLoading} isError={query.isError} isFetching={query.isFetching} hasData={hasData} isNotFound={query.error ? toPublicQueryError(query.error).kind === "not-found" : false} onRetry={() => query.refetch()} loading={<div className="h-96 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />}>
            <div className="space-y-10 text-gray-700 dark:text-gray-300">
              {body?.organization_name ? <Info icon={<Building2 />} label={t("companyName")} value={text(body.organization_name)} /> : null}
              {body?.legal_form ? <Info icon={<Scale />} label={t("legalForm")} value={text(body.legal_form)} /> : null}
              {body?.address ? <Info icon={<MapPin />} label={t("address")} value={text(body.address)} /> : null}
              {body?.representative ? <Info icon={<UserCheck />} label={t("representative")} value={text(body.representative)} /> : null}
              {body?.registry_court || body?.registry_number || body?.vat_id ? <Info icon={<Scale />} label={t("registration")} value={[body.registry_court && text(body.registry_court), body.registry_number, body.vat_id].filter(Boolean).join(" · ")} /> : null}
              {body?.phone || body?.email ? <Info icon={<Phone />} label={t("contact")} value={[body.phone, body.email].filter(Boolean).join(" · ")} /> : null}
              {body?.content_responsibility ? <Info icon={<Mail />} label={t("contentResponsibility")} value={text(body.content_responsibility)} /> : null}
            </div>
          </PublicContentStateBoundary>
        </div>
      </PageContainer>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <section className="border-b border-gray-100 pb-6 last:border-0 dark:border-gray-800"><h2 className="mb-3 flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white">{icon}{label}</h2><p className="whitespace-pre-line leading-relaxed">{value}</p></section>;
}
