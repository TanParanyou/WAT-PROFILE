import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { QuestionForm } from "@/features/public/community/components/QuestionForm";

const COMMUNITY_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === "true";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });
  return { title: t("askTitle"), description: t("askDescription") };
}

export default async function CommunityAskPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!COMMUNITY_ENABLED) notFound();
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: "Community" });
  return <NextIntlClientProvider locale={locale} messages={messages}><div className="min-h-screen bg-site-canvas"><PageHeader variant="reading" align="left" title={t("askTitle")} subtitle={t("askDescription")} /><PageContainer width="reading"><QuestionForm /></PageContainer></div></NextIntlClientProvider>;
}
