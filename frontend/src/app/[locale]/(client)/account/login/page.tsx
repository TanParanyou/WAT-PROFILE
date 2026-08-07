import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { LoginForm } from "@/features/public/account/components/LoginForm";
import { AuthShell } from "@/features/public/account/components/AuthShell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/account/login`,
    seo: normalizeSeo({}),
    content: { title: t("login.title"), description: t("login.subtitle") },
    messages: { title: t("login.title"), description: t("login.subtitle") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AuthShell
      context={{
        title: t("login.title"),
        subtitle: t("login.subtitle"),
        backHref: "/",
        backLabel: t("back"),
      }}
    >
      <LoginForm />
    </AuthShell>
  );
}
