import api from "./adminApi";
import type { ApiResponse, PaginatedResponse } from "@/types/api";
import type { AdminListParams } from "@/features/admin-list/types";
import { serializeAdminListParams } from "@/features/admin-list/url";
import type {
  Event,
  EventCategory,
  Monk,
  Gallery,
  GalleryCategory,
  Schedule,
  Donation,
  DonationCategory,
  Member,
  ContactInquiry,
  Setting,
  User,
  Role,
  CalendarResourceEntity,
} from "@/types/entities";
import type { Chanting } from "@/types/chanting";

// Generic CRUD helpers สำหรับ admin endpoints
export function createAdminService<T>(resource: string) {
  const cleanResource = resource.replace(/^\/+|\/+$/g, '');
  return {
    async getPaginated(params: AdminListParams): Promise<PaginatedResponse<T>> {
      const queryString = serializeAdminListParams(params);
      const url = queryString ? `/admin/${cleanResource}?${queryString}` : `/admin/${cleanResource}`;
      const res = await api.get<PaginatedResponse<T>>(url);
      return res.data;
    },

    /**
     * @deprecated Use `getPaginated` instead.
     */
    async getAll(
      params?: Record<string, string | number>,
    ): Promise<{ data: T[]; total: number }> {
      const res = await api.get(`/admin/${cleanResource}`, { params: { limit: 100, ...params } });
      const body = res.data;
      // รองรับทั้ง paginated และ non-paginated response
      if (body.pagination) {
        return { data: body.data || [], total: body.pagination.total || 0 };
      }
      const data = Array.isArray(body.data) ? body.data : [];
      return { data, total: data.length };
    },

    async getById(id: number | string): Promise<T> {
      const res = await api.get<ApiResponse<T>>(`/admin/${cleanResource}/${id}`);
      return res.data.data!;
    },

    async create(data: Partial<T>): Promise<T> {
      const res = await api.post<ApiResponse<T>>(`/admin/${cleanResource}`, data);
      return res.data.data!;
    },

    async update(id: number | string, data: Partial<T>): Promise<T> {
      const res = await api.put<ApiResponse<T>>(
        `/admin/${cleanResource}/${id}`,
        data,
      );
      return res.data.data!;
    },

    async delete(id: number | string): Promise<void> {
      await api.delete(`/admin/${cleanResource}/${id}`);
    },

    async bulkDelete(ids: (number | string)[]): Promise<void> {
      await api.delete(`/admin/${cleanResource}/bulk`, { data: { ids } });
    },
  };
}

export const eventAdminService = createAdminService<Event>("events");
export const eventCategoryAdminService = createAdminService<EventCategory>("event-categories");
export const calendarResourceAdminService = createAdminService<CalendarResourceEntity>("calendar-resources");
export const monkAdminService = createAdminService<Monk>("monks");
export const galleryAdminService = {
  ...createAdminService<Gallery>("gallery"),
  async bulkUpdateStatus(ids: (number | string)[], is_active: boolean): Promise<void> {
    await api.patch("/admin/gallery/bulk-status", { ids, is_active });
  },
  async bulkUpdateCategory(ids: (number | string)[], category_id: number | null): Promise<void> {
    await api.patch("/admin/gallery/bulk-category", { ids, category_id });
  },
  async bulkUpdateEvent(ids: (number | string)[], event_id: number | null): Promise<void> {
    await api.patch("/admin/gallery/bulk-event", { ids, event_id });
  },
  async createBatch(items: Partial<Gallery>[]): Promise<Gallery[]> {
    const res = await api.post<ApiResponse<Gallery[]>>("/admin/gallery/batch", { items });
    return res.data.data || [];
  },
  async reorder(ids: (number | string)[]): Promise<Gallery[]> {
    const res = await api.put<ApiResponse<Gallery[]>>("/admin/gallery/reorder", { ids });
    return res.data.data || [];
  },
};
export const scheduleAdminService = createAdminService<Schedule>("schedules");
export const donationAdminService = {
  ...createAdminService<Donation>("donations"),
  async createStaff(data: Partial<Donation>): Promise<Donation> {
    const res = await api.post<ApiResponse<Donation>>("/admin/donations", data);
    return res.data.data!;
  },
  async getProof(id: number): Promise<Blob> {
    const res = await api.get(`/admin/donations/${id}/proof`, { responseType: "blob" });
    return res.data as Blob;
  },
  async getReceipt(id: number, download?: boolean): Promise<Blob> {
    const res = await api.get(`/admin/donations/${id}/receipt`, {
      params: download ? { download: "true" } : undefined,
      responseType: "blob",
    });
    return res.data as Blob;
  },
  async confirm(id: number): Promise<Donation> {
    const res = await api.post<ApiResponse<Donation>>(`/admin/donations/${id}/confirm`);
    return res.data.data!;
  },
  async cancel(id: number, reason: string): Promise<Donation> {
    const res = await api.post<ApiResponse<Donation>>(`/admin/donations/${id}/cancel`, { reason });
    return res.data.data!;
  },
  async sendReceipt(id: number): Promise<{ donation: Donation; queued?: boolean; already_dispatched?: boolean }> {
    const res = await api.post<ApiResponse<{ donation: Donation; queued?: boolean; already_dispatched?: boolean }>>(`/admin/donations/${id}/send-receipt`);
    return res.data.data!;
  },
  async getFilterOptions(): Promise<{
    payment_methods: string[];
    currencies: string[];
    categories: DonationCategory[];
  }> {
    const res = await api.get(
      "/admin/donations/filter-options",
    );
    return res.data.data || { payment_methods: [], currencies: [], categories: [] };
  },
  async getAnnualSummary(year: number): Promise<AnnualDonationSummaryResponse> {
    const res = await api.get<ApiResponse<AnnualDonationSummaryResponse>>("/admin/donations/annual-summary", {
      params: { year },
    });
    return res.data.data!;
  },
  async getAnnualStatement(year: number, donorName?: string, donorEmail?: string): Promise<AnnualStatementResponse> {
    const res = await api.get<ApiResponse<AnnualStatementResponse>>("/admin/donations/annual-statement", {
      params: { year, donor_name: donorName, donor_email: donorEmail },
    });
    return res.data.data!;
  },
};
export const memberAdminService = createAdminService<Member>("members");
export const userAdminService = createAdminService<User>("users");
export const roleAdminService = createAdminService<Role>("roles");
export const mediaAdminService = {
  ...createAdminService<Record<string, unknown>>("media"),
  async getFilterOptions(): Promise<{
    categories: string[];
    mime_types: string[];
    alt_missing_locales: string[];
  }> {
    const res = await api.get(
      "/admin/media/filter-options"
    );
    return res.data.data || { categories: [], mime_types: [], alt_missing_locales: ["th", "en", "de"] };
  },
};
export const auditLogAdminService = {
  ...createAdminService<Record<string, unknown>>("audit-logs"),
  async getFilterOptions(): Promise<{ actions: string[]; entity_types: string[] }> {
    const res = await api.get<ApiResponse<{ actions?: string[]; entity_types?: string[]; entityTypes?: string[] }>>(
      "/admin/audit-logs/filter-options"
    );
    const raw = res.data?.data || {};
    return {
      actions: raw.actions || [],
      entity_types: raw.entity_types || raw.entityTypes || [],
    };
  },
};

// Gallery Categories
export const galleryCategoryAdminService = createAdminService<GalleryCategory>("gallery/categories");

// Donation Categories
export const donationCategoryAdminService = createAdminService<DonationCategory>("donation-categories");

// Contact
export const contactAdminService = {
  ...createAdminService<ContactInquiry>("contacts"),
  async updateStatus(
    id: number,
    status: string,
    replyMessage?: string,
  ): Promise<ContactInquiry> {
    const res = await api.put<ApiResponse<ContactInquiry>>(
      `/admin/contacts/${id}/status`,
      {
        status,
        reply_message: replyMessage,
      },
    );
    return res.data.data!;
  },
};

// Settings
export const settingsAdminService = {
  async getAll(): Promise<Setting[]> {
    const res = await api.get<ApiResponse<Setting[]>>("/admin/settings");
    return res.data.data || [];
  },
  async update(settings: Array<{ key: string; value: string }>): Promise<void> {
    await api.put("/admin/settings", settings);
  },
  async upsert(setting: Partial<Setting>): Promise<Setting> {
    const res = await api.post<ApiResponse<Setting>>(
      "/admin/settings",
      setting,
    );
    return res.data.data!;
  },
};

// Donation Stats
export const donationStatsService = {
  async getStats(): Promise<Record<string, unknown>> {
    const res = await api.get("/admin/donations/stats");
    return res.data.data || {};
  },
};

// Dashboard Stats & Overview
export interface DashboardStats {
  events: number;
  monks: number;
  gallery: number;
  schedules: number;
  donations: number;
  members: number;
  contacts: number;
}

export interface DonorAnnualSummary {
  donor_name: string;
  donor_email: string;
  donor_address: string;
  member_id?: number;
  total_amount: number;
  currency: string;
  donation_count: number;
  first_date: string;
  last_date: string;
  methods: string[];
  receipt_numbers: string[];
}

export interface AnnualDonationSummaryResponse {
  year: number;
  grand_total: number;
  currency: string;
  total_donors: number;
  total_count: number;
  donors: DonorAnnualSummary[];
}

export interface AnnualStatementResponse {
  year: number;
  donor_name?: string;
  donor_email?: string;
  donations: Donation[];
}

export interface UpcomingEventDashboardItem {
  id: number;
  title: Record<string, string>;
  slug: string;
  start_date: string;
  start_time: string;
  location: Record<string, string>;
  publish_status: string;
  registrations_count: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  pending_tasks: {
    total_unread: number;
    pending_donations: number;
    pending_registrations: number;
    pending_contacts: number;
    pending_privacy: number;
    items: Array<{
      id: string;
      type: "contact" | "registration" | "donation" | "privacy";
      title: string;
      message: string;
      link: string;
      created_at: string;
      is_new: boolean;
    }>;
  };
  upcoming_events: UpcomingEventDashboardItem[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get<ApiResponse<DashboardStats>>(
      "/admin/dashboard/stats",
    );
    return res.data.data!;
  },
  async getOverview(): Promise<DashboardOverview> {
    const res = await api.get<ApiResponse<DashboardOverview>>(
      "/admin/dashboard/overview",
    );
    return res.data.data!;
  },
};

// Registration
export const registrationAdminService = {
  ...createAdminService<Record<string, unknown>>("registrations"),
  async updateStatus(id: number, status: string, reason?: string): Promise<void> {
    await api.put(`/admin/registrations/${id}/status`, { status, reason });
  },
};

// Chanting
export const chantingAdminService = createAdminService<Chanting>("chanting");
