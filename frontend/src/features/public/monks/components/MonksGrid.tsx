import { useLocale } from "next-intl";
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
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {monks.map((monk) => (
        <Link
          key={monk.slug}
          href={`/monks/${monk.slug}`}
          className="group overflow-hidden rounded-2xl border border-primary/15 bg-white transition-colors duration-300 hover:border-primary/45 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <div className="relative aspect-[3/4]">
            <PublicImage
              src={monk.imageUrl}
              alt={getLocalizedText(monk.name, locale)}
              fill
              fallbackSrc={publicMonkFallbackImage}
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="p-6">
            {monk.title ? <p className="text-sm font-medium text-primary">
              {getLocalizedText(monk.title, locale)}
            </p> : null}
            <h3 className="mt-2 font-heading text-xl font-bold text-text-900">
              {getLocalizedText(monk.name, locale)}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
