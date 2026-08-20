import type { MonkListItem, PublicMonkDto } from "./types";
import type { LocalizedTextDto } from "../shared/api-types";

export function toMonkListItem(monk: PublicMonkDto): MonkListItem {
  return {
    slug: monk.slug,
    imageUrl: monk.image_url,
    name: monk.name,
    title: monk.title,
    dharma_name: monk.dharma_name,
    education: monk.education,
    position: monk.position,
  };
}

export function getLocalizedText(value: LocalizedTextDto | null | undefined, locale: string): string {
  if (!value) return "";

  const requested = locale === "en" ? value.en : locale === "de" ? value.de : value.th;
  return requested || value.th || value.en || value.de;
}
