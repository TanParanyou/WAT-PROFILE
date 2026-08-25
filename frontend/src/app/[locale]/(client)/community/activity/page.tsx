import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { CommunityActivity } from "@/features/public/community/components/CommunityActivity";

const COMMUNITY_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED !== "false";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });
  return {
    title: t("activityTitle"),
    description: t("activitySubtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function CommunityActivityPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!COMMUNITY_ENABLED) notFound();
  const { locale } = await params;
  const messages = await getMessages({ locale });
  return <NextIntlClientProvider locale={locale} messages={messages}><CommunityActivity /></NextIntlClientProvider>;
}
