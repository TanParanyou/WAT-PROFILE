import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { ProfileForm } from "@/features/public/account/components/ProfileForm";
import { AccountShell } from "@/features/public/account/components/AccountShell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/account`,
    seo: normalizeSeo({}),
    content: { title: t("account.title"), description: t("account.subtitle") },
    messages: { title: t("account.title"), description: t("account.subtitle") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AccountShell
      context={{
        title: t("account.title"),
        subtitle: t("account.subtitle"),
        backHref: "/",
        backLabel: t("navigation.backToSite"),
      }}
    >
      <ProfileForm />
    </AccountShell>
  );
}
