import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { CommunityContent } from "@/features/public/community/components/CommunityContent";
import { fetchCommunityCategoriesServer, fetchCommunityQuestionsServer } from "@/features/public/community/server-api";
import { communityKeys } from "@/features/public/community/queries";
import type { CommunityLocale } from "@/features/public/community/types";
import { buildPublicMetadata } from "@/features/public/seo/metadata";
import { emptySeoMetadata } from "@/features/public/seo/schema";
import { getLocalizedText } from "@/utils/localizedText";

const COMMUNITY_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED !== "false";

export default async function CommunityCategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  if (!COMMUNITY_ENABLED) notFound();
  const { locale, slug } = await params;
  const normalizedLocale: CommunityLocale = locale === "en" || locale === "de" ? locale : "th";
  const categories = await fetchCommunityCategoriesServer().catch(() => []);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const messages = await getMessages({ locale });
  const queryClient = new QueryClient();
  const options = { category_id: category.id, locale: normalizedLocale } as const;
  await queryClient.prefetchQuery({ queryKey: communityKeys.questions(options), queryFn: () => fetchCommunityQuestionsServer(options) }).catch(() => undefined);
  return <NextIntlClientProvider locale={locale} messages={messages}><HydrationBoundary state={dehydrate(queryClient)}><CommunityContent categoryID={category.id} /></HydrationBoundary></NextIntlClientProvider>;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });
  const categories = await fetchCommunityCategoriesServer().catch(() => []);
  const category = categories.find((item) => item.slug === slug);
  const categoryName = category ? getLocalizedText(category.name, locale) : t("title");
  const description = category?.description ? getLocalizedText(category.description, locale) : t("subtitle");

  return buildPublicMetadata({
    locale,
    pathname: `/${locale}/community/category/${slug}`,
    seo: emptySeoMetadata,
    content: { title: `${categoryName} | ${t("title")}`, description },
    messages: { title: t("title"), description: t("subtitle") },
  });
}
