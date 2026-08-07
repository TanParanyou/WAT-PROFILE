import { z } from "zod";
import { multiLangSchema } from "./common";

export const donationCategorySchema = z.object({
  name: multiLangSchema("Name"),
  description: multiLangSchema("Description").optional(),
  display_order: z.number(),
  is_active: z.boolean(),
});

export type DonationCategoryFormData = z.infer<typeof donationCategorySchema>;

export const staffDonationSchema = z.object({
  donor_name: z.string().optional(),
  donor_email: z.string().email("Invalid email").or(z.literal("")),
  amount: z.coerce.number().positive().refine((value) => Number.isInteger(value * 100), "Amount supports at most two decimals"),
  currency: z.literal("EUR"),
  donation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Donation date is required"),
  donation_method: z.enum(["cash", "bank_transfer", "paypal"]),
  receipt_requested: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.receipt_requested && !value.donor_email) ctx.addIssue({ code: "custom", path: ["donor_email"], message: "Email is required for a receipt" });
});

export type StaffDonationFormData = z.infer<typeof staffDonationSchema>;

export const donationSchema = z.object({
  donor_name: z.string().min(1, "Donor name is required"),
  donor_email: z.string().email("Invalid email").or(z.literal("")),
  donor_phone: z.string().optional(),
  donor_type: z.string().min(1, "Donor type is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("THB"),
  donation_date: z.string().min(1, "Donation date is required"),
  donation_method: z.string().min(1, "Donation method is required"),
  category_id: z.string().or(z.number()).optional(),
});

export type DonationFormData = z.infer<typeof donationSchema>;
