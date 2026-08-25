import axios from "axios";
import { API_BASE } from "./api";
import type { ApiSuccess } from "@/features/public/shared/api-types";
import type { PublicEventDto } from "@/features/public/events/types";
import type { PublicMonkDto } from "@/features/public/monks/types";
import type { Chanting } from "@/types/chanting";

// Create a separate public API instance (No Auth headers required normally)
export const publicApi = axios.create({
  baseURL: `${API_BASE}/api/v1/public`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const publicService = {
  async getLatestEvents(limit = 3): Promise<ApiSuccess<PublicEventDto[]>> {
    const response = await publicApi.get<ApiSuccess<PublicEventDto[]>>("/events", { params: { limit } });
    return response.data;
  },

  async getMonks(): Promise<ApiSuccess<PublicMonkDto[]>> {
    const response = await publicApi.get<ApiSuccess<PublicMonkDto[]>>("/monks");
    return response.data;
  },

  async getChantings(category?: string): Promise<ApiSuccess<Chanting[]>> {
    const response = await publicApi.get<ApiSuccess<Chanting[]>>("/chanting", {
      params: category && category !== "all" ? { category } : undefined,
    });
    return response.data;
  },

  async getChantingBySlug(slug: string): Promise<ApiSuccess<Chanting>> {
    const response = await publicApi.get<ApiSuccess<Chanting>>(`/chanting/${slug}`);
    return response.data;
  },
};
