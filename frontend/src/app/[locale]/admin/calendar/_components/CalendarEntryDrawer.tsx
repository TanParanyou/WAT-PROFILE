"use client";

import { Drawer } from "@/components/ui/Drawer";
import { Link } from "@/navigation";
import type { CalendarEntry } from "@/features/calendar/types";

export interface CalendarDrawerLabels {
  edit: string;
  close: string;
  source: string;
  status: string;
  active: string;
  inactive: string;
  location: string;
  description: string;
}

interface CalendarEntryDrawerProps {
  entry: CalendarEntry | null;
  open: boolean;
  onClose: () => void;
  labels: CalendarDrawerLabels;
}

export function canShowCalendarEditor(entry: CalendarEntry | null): boolean {
  return Boolean(entry?.detail.canEdit && entry.detail.editorHref);
}

export function CalendarEntryDrawer({ entry, open, onClose, labels }: CalendarEntryDrawerProps) {
  return (
    <Drawer isOpen={open && entry !== null} onClose={onClose} title={entry?.title} closeLabel={labels.close}>
      {entry ? (
        <div className="space-y-5 p-5 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <dt className="font-medium text-admin-muted">{labels.source}</dt><dd>{entry.source}</dd>
            <dt className="font-medium text-admin-muted">{labels.status}</dt><dd>{entry.status === "active" ? labels.active : labels.inactive}</dd>
            {entry.detail.location ? <><dt className="font-medium text-admin-muted">{labels.location}</dt><dd>{entry.detail.location}</dd></> : null}
          </dl>
          {entry.detail.description ? <div><h3 className="font-medium text-admin-muted">{labels.description}</h3><p className="mt-1 whitespace-pre-wrap">{entry.detail.description}</p></div> : null}
          {canShowCalendarEditor(entry) ? <Link href={entry.detail.editorHref ?? "#"} className="inline-flex min-h-11 items-center border border-admin-border px-4 font-medium hover:bg-admin-surface-muted focus-visible:outline-2 focus-visible:outline-admin-focus">{labels.edit}</Link> : null}
        </div>
      ) : null}
    </Drawer>
  );
}
