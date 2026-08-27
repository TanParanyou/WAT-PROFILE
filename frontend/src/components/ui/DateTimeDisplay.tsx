import React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  formatDate,
  formatDateTime,
  formatDateTimeWithRelative,
  formatRelativeTime,
} from "@/utils/formatters";

export interface DateTimeDisplayProps {
  date: string | Date | null | undefined;
  locale?: string;
  format?: "datetime" | "datetime-relative" | "date" | "relative";
  showIcon?: boolean;
  icon?: React.ReactNode;
  fallbackText?: string;
  className?: string;
}

export function DateTimeDisplay({
  date,
  locale = "th",
  format = "datetime-relative",
  showIcon = true,
  icon,
  fallbackText = "-",
  className,
}: DateTimeDisplayProps) {
  if (!date) {
    return <span className={cn("text-inherit", className)}>{fallbackText}</span>;
  }

  let text = fallbackText;
  switch (format) {
    case "datetime-relative":
      text = formatDateTimeWithRelative(date, locale);
      break;
    case "datetime":
      text = formatDateTime(date, locale);
      break;
    case "date":
      text = formatDate(date, locale);
      break;
    case "relative":
      text = formatRelativeTime(date, locale);
      break;
  }

  if (text === "-") {
    return <span className={cn("text-inherit", className)}>{fallbackText}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-inherit", className)}>
      {showIcon && (icon ?? <Clock size={14} className="shrink-0 opacity-70" />)}
      <span>{text}</span>
    </span>
  );
}

DateTimeDisplay.displayName = "DateTimeDisplay";
