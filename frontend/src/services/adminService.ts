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
function createAdminService<T>(resource: string) {
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
export const eventAdminService = createAdminService<Event>("events");
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
