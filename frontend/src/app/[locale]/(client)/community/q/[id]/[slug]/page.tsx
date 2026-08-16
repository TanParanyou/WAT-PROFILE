import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { QuestionDetailContent } from "@/features/public/community/components/QuestionDetail";
import { fetchCommunityQuestionServer } from "@/features/public/community/server-api";
import { communityKeys } from "@/features/public/community/queries";

const COMMUNITY_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === "true";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string; slug: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });
  const detail = await fetchCommunityQuestionServer(id).catch(() => null);
  return { title: detail?.question.title ?? t("questionNotFound"), description: detail ? detail.question.title : t("subtitle") };
}

export default async function CommunityQuestionPage({ params }: { params: Promise<{ locale: string; id: string; slug: string }> }) {
  if (!COMMUNITY_ENABLED) notFound();
  const { locale, id } = await params;
  const detail = await fetchCommunityQuestionServer(id).catch(() => null);
  if (!detail) notFound();
  const messages = await getMessages({ locale });
  const queryClient = new QueryClient();
  queryClient.setQueryData(communityKeys.question(id), detail);
  return <NextIntlClientProvider locale={locale} messages={messages}><HydrationBoundary state={dehydrate(queryClient)}><QuestionDetailContent id={id} /></HydrationBoundary></NextIntlClientProvider>;
}
