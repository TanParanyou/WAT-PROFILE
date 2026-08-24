import { useQuery } from "@tanstack/react-query";
import { accountApi } from "../account/api";

export interface AccountDonationCategory {
  id: number;
  name: {
    th?: string;
    en?: string;
    de?: string;
  };
}

export interface AccountDonationPurpose {
  th?: string;
  en?: string;
  de?: string;
}

export interface AccountDonationItem {
  id: number;
  receipt_number: string;
  amount: number;
  currency: string;
  donation_date: string;
  donation_time?: {
    hour: number;
    minute: number;
  } | null;
  status: "pending" | "confirmed" | "cancelled";
  receipt_available: boolean;
  category?: AccountDonationCategory | null;
  purpose?: AccountDonationPurpose | null;
  cancellation_reason?: string;
  cancelled_at?: string | null;
}

export interface AccountDonationsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AccountDonationsPage {
  items: readonly AccountDonationItem[];
  pagination: AccountDonationsPagination;
}

interface RawPaginatedResponse {
  success: boolean;
  data: AccountDonationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages?: number;
    totalPages?: number;
  };
}

export async function fetchAccountDonations(params: {
  page: number;
  limit: number;
}): Promise<AccountDonationsPage> {
  const response = await accountApi.get<RawPaginatedResponse>(
    "/account/donations",
    {
      params: {
        page: params.page,
        limit: params.limit,
      },
    },
  );

  const data = response.data;
  const totalPages =
    data.pagination.totalPages ??
    data.pagination.total_pages ??
    Math.ceil(data.pagination.total / (data.pagination.limit || 1));

  return {
    items: data.data || [],
    pagination: {
      page: data.pagination.page,
      limit: data.pagination.limit,
      total: data.pagination.total,
      totalPages: totalPages > 0 ? totalPages : 1,
    },
  };
}

export async function downloadDonationReceipt(
  donationId: number,
  receiptNumber: string,
): Promise<void> {
  const response = await accountApi.get<Blob>(
    `/account/donations/${donationId}/receipt`,
    {
      responseType: "blob",
    },
  );

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `receipt-${receiptNumber || donationId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function useAccountDonationsQuery(params: {
  page: number;
  limit: number;
}) {
  return useQuery({
    queryKey: ["account", "donations", params.page, params.limit],
    queryFn: () => fetchAccountDonations(params),
    staleTime: 30_000,
  });
}
