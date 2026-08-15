import { z } from "zod";

export interface ContactSchemaMessages {
  required: string;
  invalidEmail: string;
  nameLimit: string;
  emailLimit: string;
  subjectLimit: string;
  messageLimit: string;
}

const codePointLength = (value: string) => Array.from(value).length;

export function createContactSchema(messages: ContactSchemaMessages) {
  return z.object({
    name: z.string().trim().min(1, messages.required).refine((value) => codePointLength(value) <= 120, messages.nameLimit),
    email: z.string().trim().min(1, messages.required).email(messages.invalidEmail).refine((value) => codePointLength(value) <= 254, messages.emailLimit),
    subject: z.string().trim().min(1, messages.required).refine((value) => codePointLength(value) <= 200, messages.subjectLimit),
    message: z.string().trim().min(1, messages.required).refine((value) => codePointLength(value) <= 5000, messages.messageLimit),
    website: z.string(),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof createContactSchema>>;
