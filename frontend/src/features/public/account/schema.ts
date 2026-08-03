import { z } from "zod";
import type { Account } from "./types";

export const accountSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    email_verified: z.boolean(),
    account_status: z.enum(["pending_verification", "active", "disabled", "closed"]),
    display_name: z.string().min(2).max(80),
    avatar_url: z.string().url().or(z.literal("")),
    preferred_locale: z.enum(["th", "en", "de"]),
    providers: z.array(z.enum(["password", "google"])),
  })
  .strict();

export type AccountDto = z.infer<typeof accountSchema>;

export function parseAccount(payload: unknown): Account {
  return accountSchema.parse(payload);
}

export const accountSessionResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      access_token: z.string().min(1),
      expires_in: z.number().int().positive(),
    }),
  })
  .strict();

export type AccountSessionResponseDto = z.infer<typeof accountSessionResponseSchema>;

export function parseAccountSessionResponse(payload: unknown): { access_token: string; expires_in: number } {
  return accountSessionResponseSchema.parse(payload).data;
}

export const accountEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: accountSchema,
  })
  .strict();

export function parseAccountEnvelope(payload: unknown): Account {
  return accountEnvelopeSchema.parse(payload).data;
}

export const fieldErrorSchema = z
  .object({
    field: z.string(),
    message: z.string(),
  })
  .strict();

export const accountErrorEnvelopeSchema = z
  .object({
    success: z.literal(false),
    error: z.string(),
    code: z.string(),
    field_errors: z.array(fieldErrorSchema).optional(),
  })
  .strict();

export const sessionsEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        sessions: z.array(
          z
            .object({
              id: z.string().uuid(),
              current: z.boolean(),
              user_agent_summary: z.string(),
              ip_prefix: z.string(),
              created_at: z.string(),
              last_used_at: z.string(),
              expires_at: z.string(),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();
