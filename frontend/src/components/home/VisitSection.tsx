"use client";

import { ArrowUpRight, MapPin, MessageCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { usePublicSiteSettings } from "@/features/public/settings/PublicSiteSettingsProvider";
import { getLocalizedText } from "@/utils/localizedText";

export default function VisitSection() {
  const locale = useLocale();
  const t = useTranslations("VisitSection");
  const settings = usePublicSiteSettings();
  const address = getLocalizedText(settings.address, locale) || t("addressFallback");

  return (
    <section className="bg-secondary text-white" aria-labelledby="visit-title">
      <div className="container mx-auto flex flex-col gap-10 px-4 py-16 md:px-6 lg:flex-row lg:items-end lg:justify-between lg:py-20">
        <div className="max-w-2xl">
          <h2 id="visit-title" className="text-balance font-heading text-3xl font-bold md:text-5xl">{t("title")}</h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-white/85">{t("description")}</p>
          <div className="mt-8 flex items-start gap-3 text-white/90">
            <MapPin aria-hidden="true" className="mt-1 shrink-0" size={20} />
            <div><p className="text-sm font-semibold">{t("addressLabel")}</p><p className="mt-1 text-pretty">{address}</p></div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            {t("planVisit")}<ArrowUpRight aria-hidden="true" size={18} />
          </Link>
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/45 px-6 py-3 font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <MessageCircle aria-hidden="true" size={18} />{t("contact")}
          </Link>
        </div>
      </div>
    </section>
  );
}
