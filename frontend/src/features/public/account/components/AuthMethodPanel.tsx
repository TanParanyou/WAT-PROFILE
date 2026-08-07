import { Loader2, UserRound } from "lucide-react";

interface AuthMethodPanelProps {
  googleLabel: string;
  dividerLabel: string;
  loading: boolean;
  onGoogle: () => void;
}

export function AuthMethodPanel({ googleLabel, dividerLabel, loading, onGoogle }: AuthMethodPanelProps) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => void onGoogle()}
        disabled={loading}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-site-border bg-site-canvas px-6 py-[13px] font-semibold text-site-foreground transition-colors hover:bg-site-surface focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-site-focus disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UserRound className="h-5 w-5" aria-hidden="true" />}
        {googleLabel}
      </button>

      <div className="flex items-center gap-3 text-sm text-site-muted" role="separator" aria-label={dividerLabel}>
        <span className="h-px flex-1 bg-site-border" aria-hidden="true" />
        <span>{dividerLabel}</span>
        <span className="h-px flex-1 bg-site-border" aria-hidden="true" />
      </div>
    </div>
  );
}
