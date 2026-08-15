import type { CalendarResourceEntity } from "@/types/entities";

export function isResourceDeletionDisabled(resource: Pick<CalendarResourceEntity, "assignment_count">): boolean {
  return resource.assignment_count > 0;
}
