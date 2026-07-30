"use client";

import { useLocale, useTranslations } from "next-intl";
import { PublicReadingPage } from "@/components/public/layout/PublicReadingPage";
import { PublicContentStateBoundary } from "@/features/public/content/components/PublicContentStateBoundary";
import { usePublicImpressumQuery } from "@/features/public/content/queries";
import { toPublicQueryError } from "@/features/public/shared/query-error";
import { getLocalizedText } from "@/utils/localizedText";

export default function ImpressumContent() {
  const locale = useLocale();
  const t = useTranslations("ImpressumPage");
  const query = usePublicImpressumQuery();
  const page = query.data;
  const body = page?.body;
  const text = (value: Parameters<typeof getLocalizedText>[0] | undefined) =>
    value ? getLocalizedText(value, locale) : "";
  const title = page ? text(page.title) || t("title") : t("title");
  const hasData = Boolean(
    body &&
      [
        body.organization_name,
        body.legal_form,
        body.address,
        body.phone,
        body.email,
        body.representative,
        body.registry_court,
        body.registry_number,
        body.vat_id,
        body.content_responsibility,
      ].some((value) => (typeof value === "string" ? value : text(value)).length > 0),
  );

  return (
    <PublicReadingPage title={title}>
      <PublicContentStateBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        isFetching={query.isFetching}
        hasData={hasData}
        isNotFound={
          query.error ? toPublicQueryError(query.error).kind === "not-found" : false
        }
        onRetry={() => query.refetch()}
        loading={<ImpressumSkeleton />}
      >
        <div className="divide-y divide-primary/15">
          {body?.organization_name ? (
            <Info label={t("companyName")} value={text(body.organization_name)} />
          ) : null}
          {body?.legal_form ? (
            <Info label={t("legalForm")} value={text(body.legal_form)} />
          ) : null}
          {body?.address ? <Info label={t("address")} value={text(body.address)} /> : null}
          {body?.representative ? (
            <Info label={t("representative")} value={text(body.representative)} />
          ) : null}
          {body?.registry_court || body?.registry_number || body?.vat_id ? (
            <Info
              label={t("registration")}
              value={[body.registry_court && text(body.registry_court), body.registry_number, body.vat_id]
                .filter(Boolean)
                .join(" · ")}
            />
          ) : null}
          {body?.phone || body?.email ? (
            <section className="py-7">
              <h2 className="font-heading text-xl font-bold text-text-900">{t("contact")}</h2>
              <div className="mt-3 flex flex-col gap-2 not-prose">
                {body.phone ? (
                  <a
                    href={`tel:${body.phone}`}
                    className="w-fit text-text-800 underline decoration-primary/40 underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {body.phone}
                  </a>
                ) : null}
                {body.email ? (
                  <a
                    href={`mailto:${body.email}`}
                    className="w-fit break-all text-text-800 underline decoration-primary/40 underline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {body.email}
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}
          {body?.content_responsibility ? (
            <Info
              label={t("contentResponsibility")}
              value={text(body.content_responsibility)}
            />
          ) : null}
        </div>
      </PublicContentStateBoundary>
    </PublicReadingPage>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <section className="py-7">
      <h2 className="font-heading text-xl font-bold text-text-900">{label}</h2>
      <p className="mt-3 whitespace-pre-line break-words leading-8 text-text-800">{value}</p>
    </section>
  );
}

function ImpressumSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-primary/15" aria-label="Loading">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="space-y-3 py-7">
          <div className="h-6 w-1/3 rounded bg-primary/10" />
          <div className="h-4 w-4/5 rounded bg-primary/10" />
        </div>
      ))}
    </div>
  );
}
