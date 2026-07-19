"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function WelcomeSection() {
  const t = useTranslations("WelcomeSection");
  const tSite = useTranslations("Site");

  return (
    <section className="bg-white py-20 dark:bg-zinc-950" aria-labelledby="welcome-title">
      <div className="container mx-auto grid gap-12 px-4 md:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-16">
        <div className="relative overflow-hidden rounded-2xl bg-zinc-100">
          <Image
            src="/images/gallery/common/LINE_ALBUM_1262026_260208_10.jpg"
            alt={t("imageAlt")}
            width={960}
            height={1200}
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
        <div className="max-w-2xl">
          <p className="mb-4 font-sans text-sm font-semibold text-secondary">{t("welcome")}</p>
          <h2 id="welcome-title" className="text-balance font-heading text-3xl font-bold leading-tight text-primary md:text-5xl">
            {tSite("name")}
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-gray-600 dark:text-gray-300">{t("description")}</p>
          <ul className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            <li className="py-4"><h3 className="font-heading text-xl font-bold text-zinc-900 dark:text-white">{t("meditation")}</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("meditationDesc")}</p></li>
            <li className="py-4"><h3 className="font-heading text-xl font-bold text-zinc-900 dark:text-white">{t("sundaySchool")}</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("sundaySchoolDesc")}</p></li>
            <li className="py-4"><h3 className="font-heading text-xl font-bold text-zinc-900 dark:text-white">{t("culture")}</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t("cultureDesc")}</p></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
