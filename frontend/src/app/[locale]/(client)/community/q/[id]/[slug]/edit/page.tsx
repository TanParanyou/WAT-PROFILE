import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { QuestionEditContent } from "@/features/public/community/components/QuestionEditContent";

const COMMUNITY_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED !== "false";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });
  return { title: t("editQuestion"), description: t("editQuestionDescription") };
}

export default async function CommunityQuestionEditPage({ params }: { params: Promise<{ locale: string; id: string; slug: string }> }) {
  if (!COMMUNITY_ENABLED) notFound();
  const { locale, id } = await params;
  const messages = await getMessages({ locale });
  return <NextIntlClientProvider locale={locale} messages={messages}><QuestionEditContent id={id} /></NextIntlClientProvider>;
}
