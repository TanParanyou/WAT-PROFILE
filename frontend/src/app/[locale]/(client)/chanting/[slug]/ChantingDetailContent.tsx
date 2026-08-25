"use client";

import React, { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { notFound } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import { ChantingReader } from "@/features/public/chanting/components/ChantingReader";
import { publicService } from "@/services/publicService";
import type { Chanting } from "@/types/chanting";
import { Loader2 } from "lucide-react";

export default function ChantingDetailContent({ slug }: { slug: string }) {
  const t = useTranslations("Chanting");
  const locale = useLocale() as "th" | "en" | "de";
  const [chanting, setChantings] = useState<Chanting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    publicService
      .getChantingBySlug(slug)
      .then((res) => {
        if (mounted && res.data) {
          setChantings(res.data);
        } else if (mounted) {
          setHasError(true);
        }
      })
      .catch(() => {
        if (mounted) setHasError(true);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-site-canvas pt-24 sm:pt-28 md:pt-32 print:pt-0">
        <PageContainer width="reading" className="!pt-0">
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 animate-spin text-site-accent" />
            <p className="text-sm font-medium text-site-muted">{t("loading")}</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (hasError || !chanting) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-site-canvas pt-24 sm:pt-28 md:pt-32 print:pt-0">
      <PageContainer width="reading" className="!pt-0">
        <ChantingReader chanting={chanting} locale={locale} />
      </PageContainer>
    </div>
  );
}
