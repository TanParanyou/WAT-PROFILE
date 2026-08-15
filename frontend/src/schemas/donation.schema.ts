import { z } from "zod";
import { multiLangSchema } from "./common";

export const donationCategorySchema = z.object({
  name: multiLangSchema("Name"),
  description: multiLangSchema("Description").optional(),
  display_order: z.number(),
  is_active: z.boolean(),
});

export type DonationCategoryFormData = z.infer<typeof donationCategorySchema>;

export const createStaffDonationSchema = (t?: (key: string) => string) => {
  const msg = (key: string, fallback: string) => (t ? t(key) : fallback);
  return z
    .object({
      donor_name: z.string().optional(),
      donor_email: z.string().optional(),
      donor_phone: z.string().optional(),
      donor_address: z.string().optional(),
      donor_type: z.string().optional(),
      is_anonymous: z.boolean().default(false),
      amount: z.coerce
        .number({ message: msg("donations.amountRequired", "Amount must be greater than 0") })
        .positive(msg("donations.amountRequired", "Amount must be greater than 0"))
        .refine(
          (value) => Number.isInteger(value * 100),
          msg("donations.amountMaxDecimals", "Amount supports at most two decimals")
        ),
      currency: z.literal("EUR").default("EUR"),
      donation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, msg("donations.dateRequired", "Donation date is required")),
      donation_time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, msg("donations.timeRequired", "Donation time is required")),
      donation_method: z.enum(["cash", "bank_transfer", "paypal"]),
      category_id: z.number().int().positive().nullable().optional(),
      receipt_requested: z.boolean().default(false),
      notes: z.string().optional(),
    })
    .superRefine((value, ctx) => {
      if (!value.is_anonymous && (!value.donor_name || !value.donor_name.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["donor_name"],
          message: msg("donations.donorNameRequired", "Donor name is required when not anonymous"),
        });
      }

      const email = value.donor_email?.trim() || "";
      if (value.receipt_requested && !email) {
        ctx.addIssue({
          code: "custom",
          path: ["donor_email"],
          message: msg("donations.emailRequiredForReceipt", "Email is required for a receipt"),
        });
      } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        ctx.addIssue({
          code: "custom",
          path: ["donor_email"],
          message: msg("donations.invalidEmail", "Invalid email format"),
        });
      }

      const phone = value.donor_phone?.trim() || "";
      if (
        phone &&
        (!/^[+0-9() -]{7,32}$/.test(phone) ||
          (phone.match(/[0-9]/g) || []).length < 7 ||
          (phone.match(/[0-9]/g) || []).length > 15)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["donor_phone"],
          message: msg("donations.invalidPhone", "Invalid phone number"),
        });
      }
    });
};

export const staffDonationSchema = createStaffDonationSchema();

export type StaffDonationFormData = z.infer<typeof staffDonationSchema>;

export const donationSchema = z.object({
  donor_name: z.string().min(1, "Donor name is required"),
  donor_email: z.string().email("Invalid email").or(z.literal("")),
  donor_phone: z.string().optional(),
  donor_type: z.string().min(1, "Donor type is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.literal("EUR"),
  donation_date: z.string().min(1, "Donation date is required"),
  donation_method: z.string().min(1, "Donation method is required"),
  category_id: z.string().or(z.number()).optional(),
});

export type DonationFormData = z.infer<typeof donationSchema>;
