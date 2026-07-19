"use client";

import { ArrowRight, MapPinned } from "lucide-react";
import { Link } from "@/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePublicHomePageQuery } from "@/features/public/content/home";
import { toHomeHeroModel } from "@/features/public/content/home-section";
import { getLocalizedText } from "@/utils/localizedText";

export default function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("HeroSection");
  const tSite = useTranslations("Site");
  const shouldReduceMotion = useReducedMotion();
  const homeQuery = usePublicHomePageQuery();
  const hero = toHomeHeroModel(homeQuery.data ?? null);
  const title = hero.title ? getLocalizedText(hero.title, locale) : tSite("name");
  const description = hero.description ? getLocalizedText(hero.description, locale) : t("inLocation");
  const ctaLabel = hero.ctaLabel ? getLocalizedText(hero.ctaLabel, locale) : t("viewEvents");
  const ctaHref = hero.ctaHref ?? "/events";

  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden">
      {/* Background Image (Placeholder) */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: "url(/images/hero-bg.png)",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-5xl px-4 text-center">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
        >
          <p className="mb-4 font-sans text-lg font-medium text-white/90 md:text-xl">
            {t("welcomeTo")}
          </p>
          <h1 className="mb-6 text-balance font-heading text-5xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">
            {title}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg font-light leading-relaxed text-white/85 md:text-xl">
            {hero.description ? description : t("promise")}
          </p>

          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href={ctaHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-medium text-white transition-colors duration-200 hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {ctaLabel} <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/60 bg-black/15 px-8 py-3 font-medium text-white transition-colors duration-200 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <MapPinned aria-hidden="true" size={18} />
              {t("planVisit")}
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50"
        animate={shouldReduceMotion ? undefined : { y: [0, 10, 0] }}
        transition={shouldReduceMotion ? undefined : { duration: 1.5, repeat: Infinity }}
        aria-hidden="true"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </motion.div>

      {/* Fallback bg color if image fails */}
      <div className="absolute inset-0 -z-10 bg-zinc-900" />
    </section>
  );
}
