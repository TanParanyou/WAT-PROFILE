import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shouldRetryPublicQuery } from "../shared/query-error";
import { publicEventsKeys } from "../events/queries";
import {
  cancelAccountRegistration,
  cancelGuestRegistration,
  createEventRegistration,
  fetchAdminEventRegistration,
  fetchAdminEventRegistrations,
  listAccountRegistrations,
  resolveGuestRegistration,
  setAdminEventRegistrationStatus,
  setAdminParticipantAttendance,
  rotateAdminRegistrationManageLink,
  updateAccountRegistration,
  updateAdminEventRegistration,
  updateGuestRegistration,
} from "./api";
import type {
  AdminRegistrationListParams,
  RegistrationCancelInput,
  RegistrationCreateInput,
  RegistrationManageInput,
  RegistrationStatus,
  RegistrationUpdateInput,
} from "./types";

export const eventRegistrationKeys = {
  all: ["public", "event-registrations"] as const,
  guest: (token: string) => [...eventRegistrationKeys.all, "guest", token] as const,
  account: () => [...eventRegistrationKeys.all, "account"] as const,
  admin: (params: AdminRegistrationListParams) => ["admin", "event-registrations", params] as const,
  adminDetail: (id: number) => ["admin", "event-registration", id] as const,
};

export function useCreateEventRegistration() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ eventId, input }: { eventId: number; input: RegistrationCreateInput }) => createEventRegistration(eventId, input), onSuccess: () => { client.invalidateQueries({ queryKey: publicEventsKeys.all }); } });
}

export function useGuestRegistrationQuery(token: string) {
  return useQuery({ queryKey: eventRegistrationKeys.guest(token), queryFn: () => resolveGuestRegistration(token), enabled: token.length > 0, retry: false });
}

export function useUpdateGuestRegistration() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: RegistrationManageInput) => updateGuestRegistration(input), onSuccess: (data, input) => { client.setQueryData(eventRegistrationKeys.guest(input.token), data); client.invalidateQueries({ queryKey: publicEventsKeys.all }); } });
}

export function useCancelGuestRegistration() {
  const client = useQueryClient();
  return useMutation({ mutationFn: cancelGuestRegistration, onSuccess: () => { client.invalidateQueries({ queryKey: publicEventsKeys.all }); } });
}

export function useAccountRegistrationsQuery(enabled = true) {
  return useQuery({ queryKey: eventRegistrationKeys.account(), queryFn: listAccountRegistrations, enabled, retry: shouldRetryPublicQuery, staleTime: 30_000 });
}

export function useUpdateAccountRegistration() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: RegistrationUpdateInput }) => updateAccountRegistration(id, input), onSuccess: () => { client.invalidateQueries({ queryKey: eventRegistrationKeys.account() }); client.invalidateQueries({ queryKey: publicEventsKeys.all }); } });
}

export function useCancelAccountRegistration() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: number; input?: RegistrationCancelInput }) => cancelAccountRegistration(id, input), onSuccess: () => { client.invalidateQueries({ queryKey: eventRegistrationKeys.account() }); client.invalidateQueries({ queryKey: publicEventsKeys.all }); } });
}

export function useAdminEventRegistrationsQuery(params: AdminRegistrationListParams) {
  return useQuery({ queryKey: eventRegistrationKeys.admin(params), queryFn: () => fetchAdminEventRegistrations(params), retry: shouldRetryPublicQuery, staleTime: 30_000 });
}

export function useAdminEventRegistrationQuery(id: number | null) {
  return useQuery({ queryKey: id ? eventRegistrationKeys.adminDetail(id) : ["admin", "event-registration", "none"], queryFn: () => fetchAdminEventRegistration(id as number), enabled: id !== null, retry: shouldRetryPublicQuery });
}

export function useAdminEventRegistrationStatus() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, status, reason }: { id: number; status: RegistrationStatus; reason?: string }) => setAdminEventRegistrationStatus(id, status, reason), onSuccess: (_, input) => { client.invalidateQueries({ queryKey: ["admin", "event-registrations"] }); client.invalidateQueries({ queryKey: eventRegistrationKeys.adminDetail(input.id) }); } });
}

export function useAdminParticipantAttendance() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ registrationId, participantId, attended }: { registrationId: number; participantId: number; attended: boolean }) => setAdminParticipantAttendance(registrationId, participantId, attended), onSuccess: (_, input) => { client.invalidateQueries({ queryKey: eventRegistrationKeys.adminDetail(input.registrationId) }); } });
}

export function useRotateAdminRegistrationManageLink() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: number) => rotateAdminRegistrationManageLink(id), onSuccess: (_, id) => { client.invalidateQueries({ queryKey: eventRegistrationKeys.adminDetail(id) }); } });
}

export function useUpdateAdminEventRegistration() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: number; input: RegistrationUpdateInput & { cancellation_reason?: string } }) => updateAdminEventRegistration(id, input), onSuccess: (_, input) => { client.invalidateQueries({ queryKey: eventRegistrationKeys.adminDetail(input.id) }); client.invalidateQueries({ queryKey: ["admin", "event-registrations"] }); } });
}
