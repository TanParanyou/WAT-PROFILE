import { z } from "zod";

export interface DonationSchemaMessages {
  amountPositive: string;
  amountDecimals: string;
  currency: string;
  dateRequired: string;
  dateInvalid: string;
  timeRequired: string;
  timeInvalid: string;
  method: string;
  nameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  phoneInvalid: string;
  categoryInvalid: string;
  receiptEmail: string;
  privacyRequired: string;
  proofRequired: string;
  proofType: string;
  proofSize: string;
}

const proofTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function createSelfReportedDonationSchema(messages: DonationSchemaMessages) {
  return z.object({
    amount: z.coerce.number(messages.amountPositive).positive(messages.amountPositive).refine((value) => Number.isInteger(value * 100), messages.amountDecimals),
    currency: z.literal("EUR", { error: messages.currency }),
    donation_date: z.string().min(1, messages.dateRequired).regex(/^\d{4}-\d{2}-\d{2}$/, messages.dateRequired).refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), messages.dateInvalid),
    donation_time: z.string().min(1, messages.timeRequired).regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, messages.timeInvalid),
    donation_method: z.enum(["bank_transfer", "paypal"], { error: messages.method }),
    donor_name: z.string().trim().min(1, messages.nameRequired),
    donor_email: z.string().trim().min(1, messages.emailRequired).email(messages.emailInvalid),
    donor_phone: z.string().optional().refine((value) => {
      const phone = value?.trim() ?? "";
      if (!phone) return true;
      const digits = (phone.match(/[0-9]/g) ?? []).length;
      return /^[+0-9() -]{1,32}$/.test(phone) && digits >= 7 && digits <= 15;
    }, messages.phoneInvalid),
    category_id: z.preprocess(
      (value) => value === "" ? null : value,
      z.coerce.number({ error: messages.categoryInvalid }).int(messages.categoryInvalid).positive(messages.categoryInvalid).nullable().optional(),
    ),
    locale: z.enum(["th", "en", "de"]),
    receipt_requested: z.boolean(),
    privacy_acknowledged: z.boolean().refine((value) => value, messages.privacyRequired),
    proof: z.custom<File>((value) => typeof File !== "undefined" && value instanceof File, messages.proofRequired)
      .refine((file) => proofTypes.includes(file.type), messages.proofType)
      .refine((file) => file.size > 0 && file.size <= 10 * 1024 * 1024, messages.proofSize),
  }).superRefine((value, context) => {
    if (value.receipt_requested && !value.donor_email.trim()) {
      context.addIssue({ code: "custom", path: ["donor_email"], message: messages.receiptEmail });
    }
  });
}

export type SelfReportedDonationValues = z.infer<ReturnType<typeof createSelfReportedDonationSchema>>;
