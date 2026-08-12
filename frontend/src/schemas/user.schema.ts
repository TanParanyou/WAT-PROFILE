import { z } from "zod";

const passwordPolicy = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((val) => {
    let groups = 0;
    if (/[a-z]/.test(val)) groups++;
    if (/[A-Z]/.test(val)) groups++;
    if (/[0-9]/.test(val)) groups++;
    if (/[^a-zA-Z0-9\s]/.test(val)) groups++;
    return groups >= 3;
  }, "Password must include at least 3 of: lowercase, uppercase, number, special character");

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: passwordPolicy,
  role_id: z.string().optional(),
  is_active: z.boolean(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: passwordPolicy.or(z.literal("")),
  role_id: z.string().optional(),
  is_active: z.boolean(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
