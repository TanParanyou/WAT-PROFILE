import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  is_active: z.boolean(),
  is_system: z.boolean().optional(),
  permissions: z
    .record(z.string(), z.unknown())
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one permission is required",
    }),
});

export type RoleFormData = z.infer<typeof roleSchema>;
