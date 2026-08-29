import { publicApi } from './publicService';
import { createAdminService } from './adminService';
import { SiteAlert } from '@/types/alert';

// Admin Alert Service
export const adminAlertService = createAdminService<SiteAlert>('site-alerts');

// Public Alerts Fetcher
export const publicAlertService = {
  getActiveAlerts: async (): Promise<SiteAlert[]> => {
    const res = await publicApi.get<{ success: boolean; data: SiteAlert[] }>('/alerts');
    return res.data.data;
  },
};
