import React from "react";
import { notFound } from "next/navigation";
import { getGuideArticleBySlug, allGuideArticles } from "@/data/admin-guide";
import { GuideArticleViewer } from "@/components/admin/guide/GuideArticleViewer";

interface GuideArticlePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export function generateStaticParams() {
  return allGuideArticles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function GuideArticlePage({ params }: GuideArticlePageProps) {
  const { slug } = await params;
  const article = getGuideArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return <GuideArticleViewer article={article} />;
}
