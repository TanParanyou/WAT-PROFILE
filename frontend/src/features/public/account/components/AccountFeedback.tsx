import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export type AccountFeedbackState =
  | { kind: "error"; message: string }
  | { kind: "success"; title: string; body: string }
  | { kind: "loading"; message: string };

export function AccountFeedback({ state }: { state: AccountFeedbackState }) {
  if (state.kind === "loading") {
    return (
      <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-site-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span>{state.message}</span>
      </div>
    );
  }

  if (state.kind === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-start gap-2 border border-emerald-700 bg-emerald-50 p-3 text-sm text-emerald-700"
      >
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">{state.title}</p>
          <p className="mt-1">{state.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div role="alert" aria-live="polite" className="flex items-start gap-2 border border-red-700 bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span>{state.message}</span>
    </div>
  );
}
