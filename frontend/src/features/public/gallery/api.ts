import { publicApi } from "@/services/publicService";
import { unwrapApiData, type ApiSuccess } from "../shared/api-types";
import type { PublicGalleryCategoryDto, PublicGalleryDto } from "./types";

export async function fetchPublicGallery(): Promise<PublicGalleryDto[]> {
  const response = await publicApi.get<ApiSuccess<PublicGalleryDto[]>>("/gallery");
  return unwrapApiData(response.data);
}

export async function fetchPublicGalleryCategories(): Promise<PublicGalleryCategoryDto[]> {
  const response = await publicApi.get<ApiSuccess<PublicGalleryCategoryDto[]>>("/gallery/categories");
  return unwrapApiData(response.data);
}
