import axios from "axios";

export type PublicQueryError =
  | { kind: "not-found"; status: 404 }
  | { kind: "transient"; status?: number }
  | { kind: "unexpected"; status?: number };

export function toPublicQueryError(error: unknown): PublicQueryError {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;

  if (status === 404) {
    return { kind: "not-found", status };
  }

  if (status === undefined || status === 408 || status === 429 || (status !== undefined && status >= 500)) {
    return { kind: "transient", status };
  }

  return { kind: "unexpected", status };
}

export function shouldRetryPublicQuery(failureCount: number, error: unknown): boolean {
  return failureCount < 1 && toPublicQueryError(error).kind === "transient";
}
