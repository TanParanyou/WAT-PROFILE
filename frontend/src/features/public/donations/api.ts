import api from "@/services/api";

export interface SelfReportedDonationPayload {
  amount: number;
  currency: "EUR";
  donation_date: string;
  donation_method: "bank_transfer" | "paypal";
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  locale: "th" | "en" | "de";
  receipt_requested: boolean;
  proof: File;
}

export async function submitSelfReportedDonation(payload: SelfReportedDonationPayload) {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) form.append(key, value instanceof File ? value : String(value));
  const response = await api.post("/public/donations", form, { headers: { "Content-Type": "multipart/form-data" } });
  return response.data.data;
}
