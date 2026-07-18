import type { LocalizedRichTextDto, LocalizedTextDto } from "../shared/api-types";

export interface PublicMonkDto {
  slug: string;
  image_url: string | null;
  name: LocalizedTextDto;
  title: LocalizedTextDto | null;
  bio: LocalizedRichTextDto | null;
  ordination_date: string | null;
  position: string | null;
  display_order: number;
}

export interface MonkListItem {
  slug: string;
  imageUrl: string | null;
  name: LocalizedTextDto;
  title: LocalizedTextDto | null;
  position: string | null;
}
