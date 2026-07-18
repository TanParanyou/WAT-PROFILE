import { Button } from "@/components/ui/Button";

export interface QueryErrorStateProps {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function QueryErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  isRetrying = false,
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-red-900"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-red-800/90">{description}</p>
      <Button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-4"
      >
        {retryLabel}
      </Button>
    </div>
  );
}
