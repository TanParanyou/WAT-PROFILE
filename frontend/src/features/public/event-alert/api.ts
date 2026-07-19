import { z } from "zod";
import { publicApi } from "@/services/publicService";
import api from "@/services/api";
import { unwrapApiData, type ApiSuccess } from "../shared/api-types";

export const eventAlertSettingsSchema = z.object({
  enabled: z.boolean(), event_id: z.number().int().nonnegative(), delay_seconds: z.number().int().min(0).max(30), dismiss_hours: z.number().int().min(1).max(720),
});
export type EventAlertSettings = z.infer<typeof eventAlertSettingsSchema>;
export async function fetchEventAlertSettings(): Promise<EventAlertSettings> {
  const response = await publicApi.get<ApiSuccess<EventAlertSettings>>("/event-alert");
  return eventAlertSettingsSchema.parse(unwrapApiData(response.data));
}
export async function fetchAdminEventAlertSettings(): Promise<EventAlertSettings> {
  const response = await api.get<{ data: EventAlertSettings }>("/admin/event-alert");
  return eventAlertSettingsSchema.parse(response.data.data);
}
export async function saveAdminEventAlertSettings(value: EventAlertSettings): Promise<EventAlertSettings> {
  const payload = eventAlertSettingsSchema.parse(value);
  const response = await api.put<{ data: EventAlertSettings }>("/admin/event-alert", payload);
  return eventAlertSettingsSchema.parse(response.data.data);
}
