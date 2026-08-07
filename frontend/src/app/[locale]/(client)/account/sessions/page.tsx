import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { SessionList } from "@/features/public/account/components/SessionList";
import { AccountShell } from "@/features/public/account/components/AccountShell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/account/sessions`,
    seo: normalizeSeo({}),
    content: { title: t("sessions.title"), description: t("sessions.subtitle") },
    messages: { title: t("sessions.title"), description: t("sessions.subtitle") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function AccountSessionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AccountShell
      context={{
        title: t("sessions.title"),
        subtitle: t("sessions.subtitle"),
        backHref: "/account?tab=security",
        backLabel: t("back"),
      }}
    >
      <SessionList />
    </AccountShell>
  );
}
