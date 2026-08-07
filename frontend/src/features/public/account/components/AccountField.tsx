import type { ReactNode } from "react";

interface AccountFieldProps {
  id: string;
  label: string;
  error?: string | null;
  description?: ReactNode;
  children: ReactNode;
}

export function AccountField({ id, label, error, description, children }: AccountFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="block text-sm font-semibold text-text-800" htmlFor={id}>
        {label}
      </label>
      {children}
      {description ? <div className="mt-1 text-sm text-site-muted">{description}</div> : null}
      {error ? (
        <p id={errorId} role="alert" aria-live="polite" className="mt-1 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
