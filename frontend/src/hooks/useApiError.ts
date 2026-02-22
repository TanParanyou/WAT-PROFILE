import { UseFormSetError } from "react-hook-form";
import { useToast } from "./useToast";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

export function useApiError() {
  const { toast } = useToast();
  // Using Admin translations as a base, this assumes we are in the admin context
  const t = useTranslations("Admin");

  /**
   * Handles API errors from Axios catch block
   *
   * @param error - The error caught from a try-catch block (usually AxiosError)
   * @param setError - Optional react-hook-form setError function to map field errors
   * @param defaultMessage - Optional fallback message if the API doesn't provide one
   */
  const handleApiError = useCallback(
    (
      error: unknown,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError?: UseFormSetError<any>,
      defaultMessage?: string,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errObj = error as any;
      // Support Axios error format
      const errData = errObj?.response?.data;

      // We check for both 'message' and 'error' keys which our backend tends to use
      // Fallback to defaultMessage or general error
      const message =
        errData?.message ||
        errData?.error ||
        defaultMessage ||
        t("common.error");

      // Check if the backend sent an object map of field-specific errors
      // Example: { errors: { email: "Email already exists", password: "Too short" } }
      if (setError && errData?.errors && typeof errData.errors === "object") {
        let hasFieldErrors = false;
        Object.entries(errData.errors).forEach(([field, fieldError]) => {
          // Assume backend returns string or array of strings for each field
          if (typeof fieldError === "string") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setError(field as any, { type: "server", message: fieldError });
            hasFieldErrors = true;
          } else if (Array.isArray(fieldError) && fieldError.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setError(field as any, {
              type: "server",
              message: String(fieldError[0]),
            });
            hasFieldErrors = true;
          }
        });

        // If we got 'errors' but couldn't parse any to the form, show a toast
        if (!hasFieldErrors) {
          toast.error(message as string);
        }
      } else {
        // No field-level errors or no setError function provided, print a standard toast
        toast.error(message as string);
      }
    },
    [toast, t],
  );

  return { handleApiError };
}
