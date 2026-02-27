import React from "react";
import { publicService } from "@/services/publicService";
import { MonkCard } from "@/components/public/MonkCard";
import { SectionLayout } from "@/components/public/SectionLayout";
import { getLocale, getTranslations } from "next-intl/server";
import type { Monk } from "@/types/entities";

export default async function PublicMonksPage() {
  const locale = await getLocale();
  const t = await getTranslations("Public.monks");

  const res = await publicService.getMonks();
  const monks: Monk[] = res?.data || [];

  return (
    <SectionLayout
      title={t("title")}
      subtitle={t("subtitle")}
      className="min-h-screen pt-24"
    >
      {monks.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {monks.map((monk) => (
            <MonkCard key={monk.id} monk={monk} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-lg">{t("noMonks")}</p>
        </div>
      )}
    </SectionLayout>
  );
}
