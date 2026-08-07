import { z } from "zod";

export const selfReportedDonationSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
  donation_method: z.enum(["bank_transfer", "paypal"]),
  donor_name: z.string().min(1),
  donor_email: z.string().email(),
  donor_phone: z.string().optional(),
  locale: z.enum(["th", "en", "de"]),
  proof: z.custom<File>((value) => typeof File !== "undefined" && value instanceof File, "Donation proof is required"),
});

export type SelfReportedDonationValues = z.infer<typeof selfReportedDonationSchema>;
