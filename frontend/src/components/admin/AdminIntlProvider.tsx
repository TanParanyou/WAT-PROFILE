"use client";

import { NextIntlClientProvider } from "next-intl";
import th from "@/messages/admin/th.json";
import en from "@/messages/admin/en.json";
import de from "@/messages/admin/de.json";
import { useAdminLocale } from "@/hooks/useAdminLocale";
import { ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messagesMap: Record<string, any> = { th, en, de };

export default function AdminIntlProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { locale, mounted } = useAdminLocale();
  const messages = messagesMap[locale] || th;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </NextIntlClientProvider>
  );
}
