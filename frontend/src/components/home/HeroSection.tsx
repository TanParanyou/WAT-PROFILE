"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePublicHomePageQuery } from "@/features/public/content/home";
import { toHomeHeroModel } from "@/features/public/content/home-section";
import { getLocalizedText } from "@/utils/localizedText";
import { usePublicSiteSettingsQuery } from "@/features/public/settings/queries";
import { PublicImage } from "@/components/public/media/PublicImage";
import { MonkLineArt } from "@/components/public/illustrations/MonkLineArt";

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

  const heroBgUrl = siteSettingsQuery.data?.hero_bg_url?.trim() || "/images/hero-bg.png";

  return (
    <section className="relative overflow-hidden bg-[#FFFEF2] text-site-foreground border-b border-site-border/30">
      <div className="mx-auto grid max-w-[1440px] items-center lg:grid-cols-2 lg:min-h-[calc(100vh-4.5rem)]">
        {/* Unified Content Section for Mobile */}
        <div className="relative z-10 flex flex-col justify-center px-6 pt-24 pb-16 sm:px-10 lg:px-[8vw] lg:py-20">
          <div className="max-w-2xl">
            {/* 1. Eyebrow */}
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-block size-2 rounded-full bg-[#C88D1E]" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#966B18]">
                {t("welcomeTo")} · {tSite("location")}
              </p>
            </div>

            {/* 2. Heading */}
            <h1 className="max-w-[11ch] text-balance font-heading text-[clamp(2.4rem,6.5vw,5.6rem)] font-bold leading-[1.06] tracking-[-0.03em] text-[#2C221E]">
              {title}
            </h1>

            {/* 3. Description */}
            <p className="mt-4 max-w-[55ch] text-base leading-relaxed text-[#5C504A] sm:text-lg lg:mt-6 lg:leading-8">
              {description}
            </p>

            {/* 4. CTA */}
            <div className="mt-7 sm:mt-9">
              <Link
                href={ctaHref}
                className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#2C221E] px-7 py-3 text-sm font-semibold text-[#FFFEF2] transition-all hover:bg-[#42342E] hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus"
              >
                {ctaLabel}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Minimal Line-Art Monk anchored at bottom-right corner on mobile */}
          <div className="absolute right-3 bottom-1 z-0 pointer-events-none opacity-80 sm:right-8 sm:bottom-2 lg:hidden">
            <MonkLineArt className="h-36 w-36 sm:h-48 sm:w-48 text-[#C88D1E]/75" />
          </div>
        </div>

        {/* Desktop Image Section */}
        <div className="hidden relative h-full min-h-[26rem] w-full overflow-hidden bg-site-surface lg:block">
          <PublicImage
            src={heroBgUrl}
            alt={t("welcomeTo")}
            fallbackSrc="/images/hero-bg.png"
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}
