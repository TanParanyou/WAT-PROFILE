"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePublicHomePageQuery } from "@/features/public/content/home";
import { toHomeHeroModel } from "@/features/public/content/home-section";
import { getLocalizedText } from "@/utils/localizedText";

export default function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("HeroSection");
  const tSite = useTranslations("Site");
  const homeQuery = usePublicHomePageQuery();
  const hero = toHomeHeroModel(homeQuery.data ?? null);
  const title = hero.title ? getLocalizedText(hero.title, locale) : tSite("name");
  const description = hero.description ? getLocalizedText(hero.description, locale) : t("inLocation");
  const ctaLabel = hero.ctaLabel ? getLocalizedText(hero.ctaLabel, locale) : t("viewEvents");
  const ctaHref = hero.ctaHref ?? "/events";

  return <section className="grid min-h-[calc(100svh-4rem)] bg-site-canvas text-site-foreground lg:grid-cols-2">
    <div className="flex items-center px-6 py-20 sm:px-10 lg:px-[8vw]">
      <div className="max-w-2xl">
        <p className="mb-5 text-sm text-site-muted">{t("welcomeTo")} · {description}</p>
        <h1 className="max-w-[11ch] text-balance font-sans text-[clamp(2.9rem,6vw,5.8rem)] font-bold leading-[1.05] tracking-[-0.03em]">{title}</h1>
        <p className="mt-8 max-w-[65ch] text-lg leading-8 text-site-body">{description}</p>
        <Link href={ctaHref} className="mt-10 inline-flex min-h-12 items-center gap-3 bg-site-action px-6 py-[13px] text-sm font-medium text-site-on-action transition-colors hover:bg-site-action-hover focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus">
          {ctaLabel}<ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
    <div className="min-h-[26rem] bg-cover bg-center lg:min-h-full" style={{ backgroundImage: "url(/images/hero-bg.png)" }} aria-label={t("welcomeTo")} role="img" />
  </section>;
}
