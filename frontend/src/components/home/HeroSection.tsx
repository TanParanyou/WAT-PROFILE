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
    <section className="relative overflow-hidden border-b border-site-border/30 bg-site-canvas text-site-foreground lg:grid lg:grid-cols-2">
      <div className="relative z-10 flex min-h-[calc(100svh-4rem)] items-center px-6 pb-80 pt-20 sm:px-10 sm:pb-96 lg:min-h-[calc(100vh-4.5rem)] lg:px-[8vw] lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm text-site-accent">{t("welcomeTo")} · {tSite("location")}</p>
          <h1 className="max-w-[11ch] text-balance font-sans text-[clamp(2.8rem,6vw,5.8rem)] font-bold leading-[1.05] tracking-[-0.03em]">{title}</h1>
          <p className="mt-6 max-w-[65ch] text-base leading-7 text-site-body sm:text-lg sm:leading-8">{description}</p>
          <Link href={ctaHref} className="mt-8 inline-flex min-h-12 items-center gap-3 bg-site-action px-6 py-[13px] text-sm font-medium text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus sm:mt-10">
            {ctaLabel}<ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
      {!siteSettingsQuery.isPending && (
        <div className="absolute bottom-0 right-0 h-72 w-[62%] overflow-hidden border-l border-t border-site-border/30 bg-site-surface sm:h-80 sm:w-[56%] lg:static lg:min-h-full lg:w-auto lg:border-t-0">
          <PublicImage
            src={heroBgUrl}
            alt={t("welcomeTo")}
            fallbackSrc={publicHeroFallbackImage}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={heroImageUrl ? "object-cover object-center" : "object-contain p-12"}
          />
        </div>
      )}
    </section>
  );
}
