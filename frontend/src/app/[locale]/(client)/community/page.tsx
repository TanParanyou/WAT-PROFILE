import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { CommunityContent } from "@/features/public/community/components/CommunityContent";
import { fetchCommunityCategoriesServer, fetchCommunityQuestionsServer } from "@/features/public/community/server-api";
import { communityKeys } from "@/features/public/community/queries";
import type { CommunityLocale } from "@/features/public/community/types";

const COMMUNITY_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === "true";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  if (!COMMUNITY_ENABLED) notFound();
  const { locale } = await params;
  const normalizedLocale: CommunityLocale = locale === "en" || locale === "de" ? locale : "th";
  const messages = await getMessages({ locale });
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({ queryKey: communityKeys.categories(), queryFn: fetchCommunityCategoriesServer }).catch(() => undefined);
  await queryClient.prefetchQuery({ queryKey: communityKeys.questions({ locale: normalizedLocale }), queryFn: () => fetchCommunityQuestionsServer({ locale: normalizedLocale }) }).catch(() => undefined);
  return <NextIntlClientProvider locale={locale} messages={messages}><HydrationBoundary state={dehydrate(queryClient)}><CommunityContent /></HydrationBoundary></NextIntlClientProvider>;
}
