import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import CalendarPageContent from "./CalendarPageContent";

import { buildPublicMetadata } from "@/features/public/seo/metadata";
import { emptySeoMetadata } from "@/features/public/seo/schema";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CalendarPage" });
  return buildPublicMetadata({
    locale,
    pathname: `/${locale}/calendar`,
    seo: emptySeoMetadata,
    content: { title: t("title"), description: t("subtitle") },
    messages: { title: t("title"), description: t("subtitle") },
  });
}

export default async function CalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CalendarPageContent />
    </NextIntlClientProvider>
  );
}
