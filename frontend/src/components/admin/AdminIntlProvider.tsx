"use client";

import { NextIntlClientProvider } from "next-intl";
import thAdmin from "@/messages/admin/th.json";
import enAdmin from "@/messages/admin/en.json";
import deAdmin from "@/messages/admin/de.json";
import thPublic from "@/messages/th.json";
import enPublic from "@/messages/en.json";
import dePublic from "@/messages/de.json";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import { ReactNode } from "react";

const messagesMap: Record<string, Record<string, unknown>> = {
  th: { ...thPublic, ...thAdmin },
  en: { ...enPublic, ...enAdmin },
  de: { ...dePublic, ...deAdmin },
};

export default function AdminIntlProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { locale, mounted } = useAdminLocale();
  const messages = messagesMap[locale] || messagesMap.th;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </NextIntlClientProvider>
  );
}
