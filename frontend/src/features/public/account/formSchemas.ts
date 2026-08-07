import { z } from "zod";
import {
  accountTextLength,
  MAX_DISPLAY_NAME_LENGTH,
  MIN_DISPLAY_NAME_LENGTH,
  validatePassword,
} from "./validation";

export interface AccountFormValidationMessages {
  emailRequired: string;
  emailInvalid: string;
  displayNameRequired: string;
  displayNameMin: string;
  displayNameMax: string;
  passwordRequired: string;
  passwordMin: string;
  passwordMax: string;
  passwordComplexity: string;
}

export function createAccountFormSchemas(messages: AccountFormValidationMessages) {
  const email = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, messages.emailRequired)
    .email(messages.emailInvalid);

  const displayName = z
    .string()
    .trim()
    .min(1, messages.displayNameRequired)
    .refine(
      (value) => accountTextLength(value) >= MIN_DISPLAY_NAME_LENGTH,
      messages.displayNameMin,
    )
    .refine(
      (value) => accountTextLength(value) <= MAX_DISPLAY_NAME_LENGTH,
      messages.displayNameMax,
    );

  const password = z.string().superRefine((value, context) => {
    const error = validatePassword(value);
    if (!error) return;
    context.addIssue({
      code: "custom",
      message: messages[error],
    });
  });

  return {
    login: z.object({
      email,
      password: z.string().min(1, messages.passwordRequired),
    }),
    register: z.object({
      displayName,
      email,
      password,
      locale: z.enum(["th", "en", "de"]),
    }),
    emailRequest: z.object({ email }),
    resetPassword: z.object({ password }),
    profile: z.object({
      displayName,
      preferredLocale: z.enum(["th", "en", "de"]),
    }),
    emailChange: z.object({ newEmail: email }),
    passwordChange: z.object({ newPassword: password }),
    passwordReauth: z.object({
      password: z.string().min(1, messages.passwordRequired),
    }),
  };
}

export type AccountFormSchemas = ReturnType<typeof createAccountFormSchemas>;
export type LoginFormValues = z.infer<AccountFormSchemas["login"]>;
export type RegisterFormValues = z.infer<AccountFormSchemas["register"]>;
export type EmailRequestFormValues = z.infer<AccountFormSchemas["emailRequest"]>;
export type ResetPasswordFormValues = z.infer<AccountFormSchemas["resetPassword"]>;
export type ProfileFormValues = z.infer<AccountFormSchemas["profile"]>;
export type EmailChangeFormValues = z.infer<AccountFormSchemas["emailChange"]>;
export type PasswordChangeFormValues = z.infer<AccountFormSchemas["passwordChange"]>;
export type PasswordReauthFormValues = z.infer<AccountFormSchemas["passwordReauth"]>;
