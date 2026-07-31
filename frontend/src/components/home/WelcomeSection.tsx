"use client";

import { useTranslations } from "next-intl";

const welcomeItems = [
  ["meditation", "meditationDesc"],
  ["sundaySchool", "sundaySchoolDesc"],
  ["culture", "cultureDesc"],
] as const;

export default function WelcomeSection() {
  const t = useTranslations("WelcomeSection");
  const tSite = useTranslations("Site");

  return <section className="bg-site-canvas px-6 py-[clamp(4rem,9vw,8rem)] text-site-foreground sm:px-10 lg:px-[8vw]">
    <div className="grid gap-10 border-t border-site-border pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <p className="text-sm text-site-muted">{t("welcome")}</p>
      <div><h2 className="max-w-[18ch] text-balance font-heading text-[clamp(2.3rem,4.8vw,4.7rem)] font-normal leading-[1.14]">{tSite("name")}</h2><p className="mt-8 max-w-[68ch] text-lg leading-8 text-site-body">{t("description")}</p></div>
    </div>
    <div className="mt-16 grid border-y border-site-border md:grid-cols-3">
      {welcomeItems.map(([title, description]) => <article className="border-b border-site-border px-0 py-8 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:not-last:border-r md:last:pr-0" key={title}><h3 className="text-xl font-medium">{t(title)}</h3><p className="mt-3 leading-7 text-site-body">{t(description)}</p></article>)}
    </div>
  </section>;
}
