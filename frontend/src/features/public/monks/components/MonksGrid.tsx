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
    <div className="grid grid-cols-1 border-t border-site-border md:grid-cols-2 lg:grid-cols-3">
      {monks.map((monk) => (
        <Link
          key={monk.slug}
          href={`/monks/${monk.slug}`}
          className="group overflow-hidden border-b border-site-border bg-site-canvas transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
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
          <div className="py-6">
            {monk.title && getLocalizedText(monk.title, locale) ? (
              <p className="text-sm font-medium text-site-accent">
                {getLocalizedText(monk.title, locale)}
              </p>
            ) : null}
            <h3 className="mt-2 font-heading text-xl font-medium text-site-foreground">
              {getLocalizedText(monk.name, locale)}
            </h3>
            {monk.dharma_name && getLocalizedText(monk.dharma_name, locale) ? (
              <p className="mt-1 text-sm text-site-muted italic">
                ({getLocalizedText(monk.dharma_name, locale)})
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
