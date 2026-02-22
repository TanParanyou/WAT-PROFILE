import { z } from "zod";

export const contactReplySchema = z.object({
  status: z.string().min(1, "Status is required"),
  reply_message: z.string().min(1, "Reply message is required"),
});

export type ContactReplyFormData = z.infer<typeof contactReplySchema>;
