import { publicApi } from "@/services/publicService";
import adminApi from "@/services/adminApi";
import { accountApi, getMemoryAccessToken, restoreSession } from "../account/api";
import { unwrapApiData, type ApiSuccess } from "../shared/api-types";
import { parseRegistrationDetail, toRegistrationApiError } from "./schema";
import type {
  AdminEventRegistrationDetail,
  AdminRegistrationListParams,
  AdminRegistrationPage,
  EventRegistrationDetail,
  EventRegistrationListItem,
  RegistrationCancelInput,
  RegistrationCreateInput,
  RegistrationManageInput,
  RegistrationStatus,
  RegistrationUpdateInput,
} from "./types";

function publicAuthConfig() {
  const token = getMemoryAccessToken();
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}

export async function createEventRegistration(eventId: number, input: RegistrationCreateInput): Promise<EventRegistrationDetail> {
  const hadAccountToken = Boolean(getMemoryAccessToken());
  try {
    const response = await publicApi.post<ApiSuccess<EventRegistrationDetail>>(`/events/${eventId}/register`, input, publicAuthConfig());
    return parseRegistrationDetail(unwrapApiData(response.data));
  } catch (error: unknown) {
    const apiError = toRegistrationApiError(error);
    if (!hadAccountToken || apiError.status !== 401) throw apiError;

    // Public registration accepts guests, but an expired optional account
    // token must be refreshed before retrying so the registration remains
    // linked to the signed-in account. The first request is rejected by the
    // auth middleware before registration side effects can occur.
    await restoreSession();
    try {
      const response = await publicApi.post<ApiSuccess<EventRegistrationDetail>>(`/events/${eventId}/register`, input, publicAuthConfig());
      return parseRegistrationDetail(unwrapApiData(response.data));
    } catch (retryError: unknown) {
      throw toRegistrationApiError(retryError);
    }
  }
}

export async function resolveGuestRegistration(token: string): Promise<EventRegistrationDetail> {
  try {
    const response = await publicApi.post<ApiSuccess<EventRegistrationDetail>>("/event-registrations/manage", { token });
    return parseRegistrationDetail(unwrapApiData(response.data));
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function updateGuestRegistration(input: RegistrationManageInput): Promise<EventRegistrationDetail> {
  try {
    const response = await publicApi.patch<ApiSuccess<EventRegistrationDetail>>("/event-registrations/manage", input);
    return parseRegistrationDetail(unwrapApiData(response.data));
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function cancelGuestRegistration(input: RegistrationCancelInput & { token: string }): Promise<void> {
  try {
    await publicApi.post("/event-registrations/cancel", input);
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function listAccountRegistrations(): Promise<readonly EventRegistrationListItem[]> {
  try {
    const response = await accountApi.get<ApiSuccess<readonly EventRegistrationListItem[]>>("/account/registrations");
    return unwrapApiData(response.data);
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function updateAccountRegistration(id: number, input: RegistrationUpdateInput): Promise<EventRegistrationDetail> {
  try {
    const response = await accountApi.patch<ApiSuccess<EventRegistrationDetail>>(`/account/registrations/${id}`, input);
    return parseRegistrationDetail(unwrapApiData(response.data));
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function cancelAccountRegistration(id: number, input: RegistrationCancelInput = {}): Promise<void> {
  try {
    await accountApi.post(`/account/registrations/${id}/cancel`, input);
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function fetchAdminEventRegistrations(params: AdminRegistrationListParams = {}): Promise<AdminRegistrationPage> {
  try {
    const search = new URLSearchParams();
    if (params.page !== undefined) search.set("page", String(params.page));
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    if (params.search) search.set("search", params.search);
    if (params.sort) search.set("sort", params.sort);
    if (params.order) search.set("order", params.order);
    if (params.from) search.set("from", params.from);
    if (params.to) search.set("to", params.to);
    for (const status of params.status ?? []) search.append("status", status);
    for (const eventId of params.event_id ?? []) search.append("event_id", String(eventId));
    for (const type of params.registration_type ?? []) search.append("registration_type", type);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await adminApi.get<{ success: true; data: readonly EventRegistrationListItem[]; pagination: AdminRegistrationPage["pagination"] }>(`/admin/event-registrations${suffix}`);
    return { items: response.data.data, pagination: response.data.pagination };
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function fetchAdminEventRegistration(id: number): Promise<AdminEventRegistrationDetail> {
  try {
    const response = await adminApi.get<ApiSuccess<AdminEventRegistrationDetail>>(`/admin/event-registrations/${id}`);
    return unwrapApiData(response.data);
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function updateAdminEventRegistration(id: number, input: RegistrationUpdateInput & { cancellation_reason?: string }): Promise<AdminEventRegistrationDetail> {
  try {
    const response = await adminApi.patch<ApiSuccess<AdminEventRegistrationDetail>>(`/admin/event-registrations/${id}`, input);
    return unwrapApiData(response.data);
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function setAdminEventRegistrationStatus(id: number, status: RegistrationStatus, reason = ""): Promise<AdminEventRegistrationDetail> {
  try {
    const response = await adminApi.put<ApiSuccess<AdminEventRegistrationDetail>>(`/admin/event-registrations/${id}/status`, { status, reason });
    return unwrapApiData(response.data);
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function setAdminParticipantAttendance(registrationId: number, participantId: number, attended: boolean): Promise<AdminEventRegistrationDetail> {
  try {
    const response = await adminApi.patch<ApiSuccess<AdminEventRegistrationDetail>>(`/admin/event-registrations/${registrationId}/participants/${participantId}/attendance`, { attended });
    return unwrapApiData(response.data);
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}

export async function rotateAdminRegistrationManageLink(id: number): Promise<void> {
  try {
    await adminApi.post(`/admin/event-registrations/${id}/manage-link`);
  } catch (error: unknown) {
    throw toRegistrationApiError(error);
  }
}
