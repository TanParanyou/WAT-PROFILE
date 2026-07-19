import { z } from "zod";
import { publicApi } from "@/services/publicService";
import { unwrapApiData, type ApiSuccess } from "../shared/api-types";

export const eventAlertSettingsSchema = z.object({
  enabled: z.boolean(), event_id: z.number().int().nonnegative(), delay_seconds: z.number().int().min(0).max(30), dismiss_hours: z.number().int().min(1).max(720),
});
export type EventAlertSettings = z.infer<typeof eventAlertSettingsSchema>;
export async function fetchEventAlertSettings(): Promise<EventAlertSettings> {
  const response = await publicApi.get<ApiSuccess<EventAlertSettings>>("/event-alert");
  return eventAlertSettingsSchema.parse(unwrapApiData(response.data));
}
