import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { getLocalizedText } from "../mappers";
import type { MonkListItem } from "../types";
import { PublicImage } from "@/components/public/media/PublicImage";
import { publicMonkFallbackImage } from "@/components/public/media/publicImageFallbacks";

interface MonksGridProps {
  monks: readonly MonkListItem[];
}

export function MonksGrid({ monks }: MonksGridProps) {
  const locale = useLocale();
  const t = useTranslations("MonksPage");

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {monks.map((monk) => (
        <Link
          key={monk.slug}
          href={`/monks/${monk.slug}`}
          className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
        >
          <div className="relative aspect-[3/4]">
            <PublicImage
              src={monk.imageUrl}
              alt={getLocalizedText(monk.name, locale)}
              fill
              fallbackSrc={publicMonkFallbackImage}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="p-6">
            <p className="text-sm font-medium text-amber-600">
              {monk.title ? getLocalizedText(monk.title, locale) : t("subtitle")}
            </p>
            <h3 className="mt-2 text-xl font-bold text-gray-900">
              {getLocalizedText(monk.name, locale)}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
