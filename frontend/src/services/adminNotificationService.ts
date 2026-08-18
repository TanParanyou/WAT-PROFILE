import adminApi from "./adminApi";
import type { ApiResponse } from "@/types/api";

export interface AdminNotificationItem {
  id: string;
  type: "contact" | "registration" | "donation";
  title: string;
  message: string;
  link: string;
  created_at: string;
  is_new: boolean;
}

export interface AdminNotificationsSummary {
  total_unread: number;
  pending_contacts: number;
  pending_registrations: number;
  pending_donations: number;
  items: AdminNotificationItem[];
}

export const adminNotificationService = {
  async getNotifications(): Promise<AdminNotificationsSummary> {
    const res = await adminApi.get<ApiResponse<AdminNotificationsSummary>>("/admin/notifications");
    return (
      res.data.data || {
        total_unread: 0,
        pending_contacts: 0,
        pending_registrations: 0,
        pending_donations: 0,
        items: [],
      }
    );
  },
};
