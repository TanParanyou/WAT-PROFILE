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
  if (!data || !Array.isArray(data.data)) {
    return {
      items: [],
      pagination: {
        page: params.page,
        limit: params.limit,
        total: 0,
        totalPages: 1,
      },
    };
  }

  const pagination = data.pagination || {
    page: params.page,
    limit: params.limit,
    total: data.data.length,
    totalPages: 1,
  };

  const totalPages =
    pagination.totalPages ??
    pagination.total_pages ??
    Math.ceil((pagination.total || 0) / (pagination.limit || 1));

  return {
    items: data.data,
    pagination: {
      page: pagination.page || params.page,
      limit: pagination.limit || params.limit,
      total: pagination.total || 0,
      totalPages: totalPages > 0 ? totalPages : 1,
    },
  };
}

export async function downloadDonationReceipt(
  donationId: number,
  receiptNumber: string,
): Promise<void> {
  try {
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
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data instanceof Blob
    ) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text) as { error?: string };
        if (json.error) {
          throw new Error(json.error);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== "Unexpected token") {
          throw parseErr;
        }
      }
    }
    throw error;
  }
}

export function useAccountDonationsQuery(
  params: {
    page: number;
    limit: number;
  },
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["account", "donations", params.page, params.limit],
    queryFn: () => fetchAccountDonations(params),
    enabled,
    staleTime: 30_000,
  });
}
