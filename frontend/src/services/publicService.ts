import axios from "axios";
import { API_BASE } from "./api";

// Create a separate public API instance (No Auth headers required normally)
export const publicApi = axios.create({
  baseURL: `${API_BASE}/api/v1/public`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const publicService = {
  getLatestEvents: async (limit: number = 3) => {
    const res = await publicApi.get("/events", { params: { limit } });
    return res.data;
  },

  getEventBySlug: async (slug: string) => {
    const res = await publicApi.get(`/events/${slug}`);
    return res.data;
  },

  getMonks: async () => {
    const res = await publicApi.get("/monks");
    return res.data;
  },

  getSchedules: async () => {
    const res = await publicApi.get("/schedules");
    return res.data;
  },

  getPublicPage: async (slug: string) => {
    const res = await publicApi.get(`/pages/${slug}`);
    return res.data;
  },
};
