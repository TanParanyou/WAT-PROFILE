import { CalendarResourceManager } from "../_components/CalendarResourceManager";
import { PermissionGuard } from "@/components/admin/PermissionGuard";

export default function CalendarResourcesPage() {
  return (
    <PermissionGuard resource="calendar_resources" action="read">
      <CalendarResourceManager />
    </PermissionGuard>
  );
}
