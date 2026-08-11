import type { CalendarView } from "./calendar-copy";

export interface CalendarViewToggleProps {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
  labels: {
    calendar: string;
    list: string;
  };
  ariaLabel: string;
  id?: string;
  variant?: "public" | "admin";
}

export function CalendarViewToggle({
  value,
  onChange,
  labels,
  ariaLabel,
  id = "events-view",
  variant = "public",
}: CalendarViewToggleProps) {
  const activeClass =
    variant === "public"
      ? "bg-site-action text-site-on-action"
      : "bg-admin-action text-admin-on-action";
  const idleClass =
    variant === "public"
      ? "text-site-muted hover:bg-site-surface hover:text-site-foreground"
      : "text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground";

  return (
    <div
      aria-label={ariaLabel}
      className={
        variant === "public"
          ? "inline-flex border border-site-border p-1"
          : "inline-flex border border-admin-control-border p-1"
      }
      id={id}
      role="tablist"
    >
      {(["calendar", "list"] as const).map((view) => {
        const selected = value === view;
        return (
          <button
            aria-selected={selected}
            className={`min-h-11 px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${selected ? activeClass : idleClass} ${variant === "public" ? "focus-visible:outline-site-focus" : "focus-visible:outline-admin-focus"}`}
            id={`${id}-${view}`}
            key={view}
            onClick={() => onChange(view)}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {view === "calendar" ? labels.calendar : labels.list}
          </button>
        );
      })}
    </div>
  );
}
