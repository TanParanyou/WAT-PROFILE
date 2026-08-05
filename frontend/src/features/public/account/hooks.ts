import { useTranslations } from "next-intl";
import type { AccountApiError } from "./types";

/**
 * Returns a function that translates an AccountApiError into a localized message.
 * It uses the 'Account' namespace from next-intl.
 */
export function useAccountErrorMessage() {
  const t = useTranslations("Account");

  return (apiError: AccountApiError): string => {
    if (apiError.code === "AUTH_UNKNOWN") {
      return apiError.message;
    }
    const key = `errors.${apiError.code}` as Parameters<typeof t>[0];
    return t(key);
  };
}
