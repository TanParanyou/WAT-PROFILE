import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/config/site.config";
import { buildPublicMetadata, normalizeSeo } from "@/features/public/seo/metadata";
import { ForgotPasswordForm } from "@/features/public/account/components/RecoveryForms";
import { AuthShell } from "@/features/public/account/components/AuthShell";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  const metadata = buildPublicMetadata({
    locale,
    pathname: `/${locale}/account/forgot-password`,
    seo: normalizeSeo({}),
    content: { title: t("forgotPassword.title"), description: t("forgotPassword.subtitle") },
    messages: { title: t("forgotPassword.title"), description: t("forgotPassword.subtitle") },
    site: { name: siteConfig.siteName.th, description: siteConfig.seo.defaultDescription, image: siteConfig.seo.defaultOgImage },
  });
  return { ...metadata, openGraph: { ...metadata.openGraph, title: `${metadata.title} | ${siteConfig.siteName.th}` } };
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return (
    <AuthShell
      context={{
        title: t("forgotPassword.title"),
        subtitle: t("forgotPassword.subtitle"),
        backHref: "/account/login",
        backLabel: t("back"),
      }}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
