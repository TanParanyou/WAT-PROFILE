"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 4, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-admin-body flex items-center min-h-[24px]">
            {label}
          </label>
        )}
        <textarea
          id={id}
          rows={rows}
          className={cn(
            "w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted",
            "focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus",
            "disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted resize-y",
            error && "border-admin-danger focus-visible:border-admin-danger focus-visible:outline-admin-danger",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-admin-danger">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
export type { TextareaProps };
