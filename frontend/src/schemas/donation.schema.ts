import { z } from "zod";

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
