"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { ChantingCatalog } from "@/features/public/chanting/components/ChantingCatalog";
import { publicService } from "@/services/publicService";
import type { Chanting } from "@/types/chanting";
import { Loader2 } from "lucide-react";

export default function ChantingPageContent() {
  const t = useTranslations("Chanting");
  const locale = useLocale() as "th" | "en" | "de";
  const [chantings, setChantings] = useState<Chanting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    publicService
      .getChantings()
      .then((res) => {
        if (mounted && res.data) {
          setChantings(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load chantings:", err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-site-canvas">
      <PageHeader
        variant="color"
        density="compact"
        align="left"
        title={t("pageTitle")}
        subtitle={t("pageDescription")}
      />
      <PageContainer width="wide">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-site-accent" />
            <p className="text-sm font-medium text-site-muted">{t("loading")}</p>
          </div>
        ) : (
          <ChantingCatalog initialChantings={chantings} locale={locale} />
        )}
      </PageContainer>
    </div>
  );
}
