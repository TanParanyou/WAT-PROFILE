import { publicApi } from "@/services/publicService";
import { unwrapApiData, type ApiSuccess } from "../shared/api-types";
import type { PublicEventDto, PublicScheduleDto } from "./types";

export async function fetchPublicEvents(limit?: number): Promise<PublicEventDto[]> {
  const response = await publicApi.get<ApiSuccess<PublicEventDto[]>>("/events", {
    params: limit ? { limit } : undefined,
  });
  return unwrapApiData(response.data);
}

export async function fetchPublicEventBySlug(slug: string): Promise<PublicEventDto> {
  const response = await publicApi.get<ApiSuccess<PublicEventDto>>(`/events/${slug}`);
  return unwrapApiData(response.data);
}

export async function fetchPublicSchedules(type?: string): Promise<PublicScheduleDto[]> {
  const response = await publicApi.get<ApiSuccess<PublicScheduleDto[]>>("/schedules", {
    params: type ? { type } : undefined,
  });
  return unwrapApiData(response.data);
}
