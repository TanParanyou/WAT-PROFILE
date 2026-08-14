"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePublicHomePageQuery } from "@/features/public/content/home";
import { toHomeHeroModel } from "@/features/public/content/home-section";
import { getLocalizedText } from "@/utils/localizedText";
import { usePublicSiteSettingsQuery } from "@/features/public/settings/queries";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicHeroFallbackImage } from "@/components/public/media/publicImageFallbacks";

export default function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("HeroSection");
  const tSite = useTranslations("Site");
  const homeQuery = usePublicHomePageQuery();
  const siteSettingsQuery = usePublicSiteSettingsQuery();

  const hero = toHomeHeroModel(homeQuery.data ?? null);
  const title = hero.title ? getLocalizedText(hero.title, locale) : tSite("name");
  const description = hero.description ? getLocalizedText(hero.description, locale) : t("inLocation");
  const ctaLabel = hero.ctaLabel ? getLocalizedText(hero.ctaLabel, locale) : t("viewEvents");
  const ctaHref = hero.ctaHref ?? "/events";

  const heroImageUrl = siteSettingsQuery.data?.hero_bg_url?.trim();
  const heroBgUrl = heroImageUrl || publicHeroFallbackImage;

  return (
    <section className="relative overflow-hidden border-b border-site-border bg-site-canvas pt-[72px] text-site-foreground">
      <div className="grid lg:min-h-[calc(100svh-72px)] lg:grid-cols-12">
        {/* ฝั่งเนื้อหา: จัดวางโปร่งตา สะอาดตา */}
        <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:col-span-7 lg:px-[6vw] lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-site-accent sm:text-sm">
              {t("welcomeTo")} · {tSite("location")}
            </p>
            <h1 className="max-w-[12ch] text-balance font-sans text-[clamp(2.4rem,5.5vw,4.8rem)] font-bold leading-[1.08] tracking-[-0.03em]">
              {title}
            </h1>
            <p className="mt-5 max-w-[58ch] text-balance text-base leading-relaxed text-site-body sm:mt-6 sm:text-lg sm:leading-8">
              {description}
            </p>

            <div className="mt-8 sm:mt-10">
              <Link
                href={ctaHref}
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 bg-site-action px-6 py-[13px] text-sm font-semibold text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus sm:w-auto"
              >
                <span>{ctaLabel}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* ฝั่งรูปภาพ: ขอบ Fade บางๆ ชิดริมขอบ ไม่กินเนื้อที่ของภาพ ทำให้เห็นภาพได้คมชัดและเนียนตา */}
        <div className="relative aspect-[4/3] w-full min-h-[260px] overflow-hidden bg-site-canvas sm:aspect-[16/10] sm:min-h-[340px] lg:col-span-5 lg:aspect-auto lg:min-h-full">
          <PublicImage
            src={heroBgUrl}
            alt={t("heroImageAlt")}
            fallbackSrc={publicHeroFallbackImage}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 42vw"
            className={heroImageUrl ? "object-cover object-center" : "object-contain p-8 sm:p-12"}
          />

          {/* 1. สำหรับ Mobile: Fade บางๆ เฉพาะขอบบนและล่าง (เพียง 8-10% ริมขอบ) */}
          <div
            className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_bottom,var(--public-canvas)_0%,transparent_10%,transparent_90%,var(--public-canvas)_100%)] lg:hidden"
            aria-hidden="true"
          />

          {/* 2. สำหรับ Desktop: Fade บางๆ เฉพาะริมขอบซ้าย (เพียง 10-12%) เพื่อลบสันขอบแข็งโดยไม่บังภาพ */}
          <div
            className="pointer-events-none absolute inset-0 z-10 hidden lg:block lg:bg-[linear-gradient(to_right,var(--public-canvas)_0%,transparent_12%)]"
            aria-hidden="true"
          />
          {/* Fade ขอบบน/ล่างของภาพใน desktop แบบอ่อนๆ ชิดขอบ */}
          <div
            className="pointer-events-none absolute inset-0 z-10 hidden lg:block lg:bg-[linear-gradient(to_bottom,var(--public-canvas)_0%,transparent_6%,transparent_94%,var(--public-canvas)_100%)] opacity-60"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
