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
      className="border border-[#945c26] bg-[#fffef2] px-5 py-6 text-[#333]"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[#505050]">{description}</p>
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
