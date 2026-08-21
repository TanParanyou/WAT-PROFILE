import { notFound, redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { QuestionDetailContent } from "@/features/public/community/components/QuestionDetail";
import { fetchCommunityQuestionServer } from "@/features/public/community/server-api";
import { communityKeys } from "@/features/public/community/queries";
import { siteConfig } from "@/config/site.config";

const COMMUNITY_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED !== "false";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string; slug: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Community" });
  const detail = await fetchCommunityQuestionServer(id).catch(() => null);
  if (!detail) return { title: t("questionNotFound"), description: t("subtitle"), robots: { index: false, follow: false } };
  const canonical = `${siteConfig.domain}/${detail.question.locale}/community/q/${detail.question.id}/${detail.question.slug}`;
  return { title: detail.question.title, description: detail.question.title, alternates: { canonical }, robots: locale === detail.question.locale ? undefined : { index: false, follow: true } };
}

export default async function CommunityQuestionPage({ params }: { params: Promise<{ locale: string; id: string; slug: string }> }) {
  if (!COMMUNITY_ENABLED) notFound();
  const { locale, id, slug } = await params;
  const detail = await fetchCommunityQuestionServer(id).catch(() => null);
  if (!detail) notFound();

  // Normalize and compare slug safely. If the slug is outdated or mismatched, redirect within the current locale.
  const decodedParamSlug = decodeURIComponent(slug || "");
  const decodedQuestionSlug = decodeURIComponent(detail.question.slug || "");
  if (decodedParamSlug && decodedQuestionSlug && decodedParamSlug !== decodedQuestionSlug) {
    redirect(`/${locale}/community/q/${detail.question.id}/${encodeURIComponent(detail.question.slug)}`);
  }
  const messages = await getMessages({ locale });
  const queryClient = new QueryClient();
  queryClient.setQueryData(communityKeys.question(id), detail);

  const qaSchema = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: detail.question.title,
      text: detail.question.title,
      answerCount: detail.question.published_answer_count || 0,
      dateCreated: detail.question.created_at,
      author: {
        '@type': 'Person',
        name: detail.question.author?.display_name || 'Community Member',
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Community',
        item: `${siteConfig.domain}/${locale}/community`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: detail.question.title,
        item: `${siteConfig.domain}/${detail.question.locale}/community/q/${detail.question.id}/${detail.question.slug}`,
      },
    ],
  };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <QuestionDetailContent id={id} />
      </HydrationBoundary>
    </NextIntlClientProvider>
  );
}
