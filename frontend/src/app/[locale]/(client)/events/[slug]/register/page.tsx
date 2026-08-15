import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import PageHeader from "@/components/layout/PageHeader";
import { RegistrationPageContent } from "@/features/public/event-registration/components/RegistrationPageContent";

interface Props { params: Promise<{ slug: string; locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventRegistration" });
  return { title: t("eyebrow"), description: t("intro") };
}

export default async function EventRegistrationPage({ params }: Props) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "EventRegistration" });
  return <div className="min-h-screen bg-site-canvas"><PageHeader variant="color" align="left" title={t("eyebrow")} subtitle={t("intro")} /><RegistrationPageContent slug={slug} /></div>;
}
