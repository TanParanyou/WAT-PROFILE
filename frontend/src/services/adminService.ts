import api from "./api";
import type { ApiResponse } from "@/types/api";
import type {
  Event,
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
} from "@/types/entities";

// Generic CRUD helpers สำหรับ admin endpoints
export function createAdminService<T>(resource: string) {
  return {
    async getAll(
      params?: Record<string, string | number>,
    ): Promise<{ data: T[]; total: number }> {
      const res = await api.get(`/admin/${resource}`, { params });
      const body = res.data;
      // รองรับทั้ง paginated และ non-paginated response
      if (body.pagination) {
        return { data: body.data || [], total: body.pagination.total || 0 };
      }
      const data = Array.isArray(body.data) ? body.data : [];
      return { data, total: data.length };
    },

    async getById(id: number | string): Promise<T> {
      const res = await api.get<ApiResponse<T>>(`/admin/${resource}/${id}`);
      return res.data.data!;
    },

    async create(data: Partial<T>): Promise<T> {
      const res = await api.post<ApiResponse<T>>(`/admin/${resource}`, data);
      return res.data.data!;
    },

    async update(id: number | string, data: Partial<T>): Promise<T> {
      const res = await api.put<ApiResponse<T>>(
        `/admin/${resource}/${id}`,
        data,
      );
      return res.data.data!;
    },

    async delete(id: number | string): Promise<void> {
      await api.delete(`/admin/${resource}/${id}`);
    },

    async bulkDelete(ids: (number | string)[]): Promise<void> {
      await api.delete(`/admin/${resource}/bulk`, { data: { ids } });
    },
  };
}

// Admin services สำหรับแต่ละ entity
const mockEvents: Event[] = [
  {
    id: 1,
    slug: "annual-merit-making",
    title: { th: "งานบุญประจำปี", en: "Annual Merit Making", de: "Jährliche Verdienstaktion" },
    description: { th: "รายละเอียดงานบุญ", en: "Merit details", de: "Details" },
    event_type: "merit",
    event_date: "2026-07-20T08:00:00Z",
    start_time: "08:00",
    end_time: "12:00",
    location: { th: "ศาลาใหญ่", en: "Main Hall", de: "Haupthalle" },
    image_url: "",
    map_url: "https://maps.google.com",
    is_recurring: false,
    recurring_pattern: "",
    max_participants: 100,
    registration_enabled: false,
    registration_deadline: null,
    display_order: 1,
    is_active: true,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
  },
  {
    id: 2,
    slug: "evening-chanting",
    title: { th: "ทำวัตรสวดมนต์", en: "Evening Chanting", de: "Abendgesang" },
    description: { th: "สวดมนต์เย็น", en: "Evening chanting", de: "Abendgesang" },
    event_type: "ceremony",
    event_date: "2026-07-25T18:00:00Z",
    start_time: "18:00",
    end_time: "19:00",
    location: { th: "อุโบสถ", en: "Ubosot", de: "Ubosot" },
    image_url: "",
    map_url: "",
    is_recurring: true,
    recurring_pattern: "daily",
    max_participants: null,
    registration_enabled: false,
    registration_deadline: null,
    display_order: 2,
    is_active: true,
    created_at: "2026-07-02T00:00:00Z",
    updated_at: "2026-07-02T00:00:00Z",
  }
];

export const eventAdminService = {
  async getAll(params?: Record<string, string | number>) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: mockEvents, total: mockEvents.length };
  },
  async getById(id: number | string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const event = mockEvents.find(e => e.id === Number(id));
    return event || mockEvents[0];
  },
  async create(data: Partial<Event>) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: Date.now(), ...data } as Event;
  },
  async update(id: number | string, data: Partial<Event>) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { id: Number(id), ...data } as Event;
  },
  async delete(id: number | string) {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  async bulkDelete(ids: (number | string)[]) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
export const monkAdminService = createAdminService<Monk>("monks");
export const galleryAdminService = createAdminService<Gallery>("gallery");
export const scheduleAdminService = createAdminService<Schedule>("schedules");
export const donationAdminService = createAdminService<Donation>("donations");
export const memberAdminService = createAdminService<Member>("members");
export const userAdminService = createAdminService<User>("users");
export const roleAdminService = createAdminService<Role>("roles");

// Gallery Categories
export const galleryCategoryAdminService = {
  async getAll(): Promise<{ data: GalleryCategory[]; total: number }> {
    const res = await api.get("/admin/gallery/categories");
    const data = Array.isArray(res.data.data) ? res.data.data : [];
    return { data, total: data.length };
  },
  async create(data: Partial<GalleryCategory>): Promise<GalleryCategory> {
    const res = await api.post<ApiResponse<GalleryCategory>>(
      "/admin/gallery/categories",
      data,
    );
    return res.data.data!;
  },
  async update(
    id: number,
    data: Partial<GalleryCategory>,
  ): Promise<GalleryCategory> {
    const res = await api.put<ApiResponse<GalleryCategory>>(
      `/admin/gallery/categories/${id}`,
      data,
    );
    return res.data.data!;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/gallery/categories/${id}`);
  },
  async bulkDelete(ids: (number | string)[]): Promise<void> {
    await api.delete(`/admin/gallery/categories/bulk`, { data: { ids } });
  },
};

// Donation Categories
export const donationCategoryAdminService = {
  async getAll(): Promise<{ data: DonationCategory[]; total: number }> {
    const res = await api.get("/admin/donation-categories");
    const data = Array.isArray(res.data.data) ? res.data.data : [];
    return { data, total: data.length };
  },
  async create(data: Partial<DonationCategory>): Promise<DonationCategory> {
    const res = await api.post<ApiResponse<DonationCategory>>(
      "/admin/donation-categories",
      data,
    );
    return res.data.data!;
  },
  async update(
    id: number,
    data: Partial<DonationCategory>,
  ): Promise<DonationCategory> {
    const res = await api.put<ApiResponse<DonationCategory>>(
      `/admin/donation-categories/${id}`,
      data,
    );
    return res.data.data!;
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/donation-categories/${id}`);
  },
  async bulkDelete(ids: (number | string)[]): Promise<void> {
    await api.delete(`/admin/donation-categories/bulk`, { data: { ids } });
  },
};

// Contact
export const contactAdminService = {
  async getAll(
    params?: Record<string, string | number>,
  ): Promise<{ data: ContactInquiry[]; total: number }> {
    const res = await api.get("/admin/contacts", { params });
    const body = res.data;
    if (body.pagination) {
      return { data: body.data || [], total: body.pagination.total || 0 };
    }
    const data = Array.isArray(body.data) ? body.data : [];
    return { data, total: data.length };
  },
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
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/contacts/${id}`);
  },
  async bulkDelete(ids: (number | string)[]): Promise<void> {
    await api.delete(`/admin/contacts/bulk`, { data: { ids } });
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

// Dashboard Stats
export interface DashboardStats {
  events: number;
  monks: number;
  gallery: number;
  schedules: number;
  donations: number;
  members: number;
  contacts: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get<ApiResponse<DashboardStats>>(
      "/admin/dashboard/stats",
    );
    return res.data.data!;
  },
};

// Registration
export const registrationAdminService = {
  async getAll(
    params?: Record<string, string | number>,
  ): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const res = await api.get("/admin/registrations", { params });
    const body = res.data;
    if (body.pagination) {
      return { data: body.data || [], total: body.pagination.total || 0 };
    }
    const data = Array.isArray(body.data) ? body.data : [];
    return { data, total: data.length };
  },
  async updateStatus(id: number, status: string): Promise<void> {
    await api.put(`/admin/registrations/${id}/status`, { status });
  },
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/registrations/${id}`);
  },
  async bulkDelete(ids: (number | string)[]): Promise<void> {
    await api.delete(`/admin/registrations/bulk`, { data: { ids } });
  },
};
