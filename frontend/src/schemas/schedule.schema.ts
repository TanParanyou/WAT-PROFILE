import { z } from "zod";
import { multiLangSchema, multiLangOptionalSchema } from "./common";

export const scheduleSchema = z
  .object({
    schedule_type: z.string().min(1, "กรุณาเลือกประเภท"),
    day_of_week: z.number().nullable(),
    time_start: z.string(),
    time_end: z.string(),
    activity: multiLangSchema("กิจกรรม"),
    location: multiLangOptionalSchema(),
    online_link: z.string(),
    is_active: z.boolean(),
    display_order: z.number().int().min(0),
  })
  .refine(
    (data) => data.schedule_type !== "weekly" || data.day_of_week !== null,
    { message: "กรุณาเลือกวัน", path: ["day_of_week"] },
  )
  .refine(
    (data) => {
      if (data.time_start && data.time_end) {
        return data.time_end > data.time_start;
      }
      return true;
    },
    { message: "เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น", path: ["time_end"] },
  );

export type ScheduleFormData = z.infer<typeof scheduleSchema>;

export const defaultScheduleValues: ScheduleFormData = {
  schedule_type: "",
  day_of_week: null,
  time_start: "",
  time_end: "",
  activity: { th: "", en: "", de: "" },
  location: { th: "", en: "", de: "" },
  online_link: "",
  is_active: true,
  display_order: 0,
};
