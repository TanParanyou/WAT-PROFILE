import type { LocalizedTextDto } from "../shared/api-types";

export interface PublicGalleryDto {
  id: number;
  image_url: string;
  thumbnail_url: string;
  caption: LocalizedTextDto;
  category_id: number | null;
  display_order: number;
}

export interface PublicGalleryCategoryDto {
  id: number;
  slug: string;
  name: LocalizedTextDto;
  display_order: number;
}
