import { z } from "zod";

export const selfReportedDonationSchema = z.object({
  amount: z.coerce.number().positive().refine((value) => Number.isInteger(value * 100), "Amount supports at most two decimals"),
  currency: z.literal("EUR"),
  donation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Donation date is required"),
  donation_method: z.enum(["bank_transfer", "paypal"]),
  donor_name: z.string().min(1),
  donor_email: z.string().email(),
  donor_phone: z.string().optional(),
  locale: z.enum(["th", "en", "de"]),
  receipt_requested: z.boolean(),
  proof: z.custom<File>((value) => typeof File !== "undefined" && value instanceof File, "Donation proof is required"),
});

export type SelfReportedDonationValues = z.infer<typeof selfReportedDonationSchema>;
