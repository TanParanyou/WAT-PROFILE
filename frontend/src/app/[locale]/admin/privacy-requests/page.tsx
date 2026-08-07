"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Button } from "@/components/ui/Button";
import { personalDataRequestService } from "@/services/personalDataRequestService";
import type { PersonalDataRequestItem } from "@/types/personal-data-request";

export default function PrivacyRequestsPage() {
  const t = useTranslations("Admin.privacyRequests");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [email, setEmail] = useState(""); const [memberCode, setMemberCode] = useState("");
  const [requestType, setRequestType] = useState<"access" | "erasure">("access");
  const [evidence, setEvidence] = useState(""); const [method, setMethod] = useState("in_person");
  const [candidates, setCandidates] = useState<PersonalDataRequestItem[]>([]);
  const requests = useQuery({ queryKey: ["admin", "privacy-requests"], queryFn: personalDataRequestService.list });
  const detail = useQuery({ queryKey: ["admin", "privacy-request", selectedId], queryFn: () => personalDataRequestService.get(selectedId!), enabled: Boolean(selectedId) });

  const create = async () => { const row = await personalDataRequestService.create({ subject_email: email, subject_member_code: memberCode, request_type: requestType }); setSelectedId(row.id); await requests.refetch(); };
  const search = async () => { const found = await personalDataRequestService.search(email, memberCode); setCandidates(found.map((item) => ({ ...item, selected_action: "" as const }))); };
  const verify = async () => { if (!selectedId) return; await personalDataRequestService.verify(selectedId, method, evidence); await detail.refetch(); };
  const sendVerification = async () => { if (selectedId) await personalDataRequestService.sendVerification(selectedId); };
  const saveSelection = async () => { if (!selectedId) return; await personalDataRequestService.select(selectedId, candidates); await detail.refetch(); };
  const downloadExport = async () => { if (!selectedId) return; const blob = await personalDataRequestService.export(selectedId); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "personal-data-export.json"; a.click(); URL.revokeObjectURL(url); };
  const complete = async () => { if (!selectedId || requestType !== "erasure") return; if (!window.confirm(t("confirmErasure"))) return; await personalDataRequestService.complete(selectedId); await detail.refetch(); await requests.refetch(); };

  return <div><AdminPageHeader title={t("title")} breadcrumbs={[{ label: t("title") }]} /><div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <section className="border border-admin-border bg-admin-surface p-5"><h2 className="mb-4 text-lg font-semibold">{t("newRequest")}</h2><div className="grid gap-3"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("emailPlaceholder")} type="email" className="min-h-11 border border-admin-control-border bg-admin-surface px-3" /><input value={memberCode} onChange={(e) => setMemberCode(e.target.value)} placeholder={t("memberCodePlaceholder")} className="min-h-11 border border-admin-control-border bg-admin-surface px-3" /><select value={requestType} onChange={(e) => setRequestType(e.target.value as typeof requestType)} className="min-h-11 border border-admin-control-border bg-admin-surface px-3"><option value="access">{t("access")}</option><option value="erasure">{t("erasure")}</option></select><PermissionGuard resource="privacy_requests" action="create"><Button onClick={() => void create()}>{t("create")}</Button></PermissionGuard><Button variant="outline" onClick={() => void search()}>{t("search")}</Button></div><div className="mt-6 space-y-2">{(requests.data || []).map((row) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} className="block w-full border border-admin-border p-3 text-left hover:bg-admin-surface-muted"><div className="font-medium">{row.subject_email || row.subject_member_code}</div><div className="text-xs text-admin-muted">{row.request_type} · {row.status}</div></button>)}</div></section>
    <section className="border border-admin-border bg-admin-surface p-5"><h2 className="mb-4 text-lg font-semibold">{t("detail")}</h2>{detail.data ? <><div className="mb-4 grid gap-2 text-sm"><div>{t("status")}: <strong>{detail.data.status}</strong></div><div>{t("verification")}: <strong>{detail.data.verification_status}</strong></div></div><div className="mb-5 flex flex-wrap gap-2"><input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder={t("evidencePlaceholder")} className="min-h-11 flex-1 border border-admin-control-border bg-admin-surface px-3" /><select value={method} onChange={(e) => setMethod(e.target.value)} className="min-h-11 border border-admin-control-border bg-admin-surface px-3"><option value="in_person">{t("inPerson")}</option><option value="email">{t("emailVerification")}</option></select><PermissionGuard resource="privacy_requests" action="update"><Button onClick={() => void verify()} disabled={detail.data.verification_status === "verified"}>{t("verify")}</Button><Button variant="outline" onClick={() => void sendVerification()}>{t("sendVerification")}</Button></PermissionGuard></div><div className="space-y-2">{candidates.map((item, index) => <label key={`${item.domain}-${item.record_id}`} className="flex items-center gap-3 border border-admin-border p-3 text-sm"><input type="checkbox" checked={Boolean(item.selected_action)} onChange={(e) => setCandidates((rows) => rows.map((row, i) => i === index ? { ...row, selected_action: e.target.checked ? (requestType === "erasure" ? "anonymise" : "export") : "" } : row))} /><span className="flex-1">{item.domain} · {item.display_name || item.record_id}<span className="ml-2 text-admin-muted">{item.masked_email}</span></span></label>)}</div><div className="mt-5 flex flex-wrap gap-2"><PermissionGuard resource="privacy_requests" action="update"><Button variant="outline" onClick={() => void saveSelection()}>{t("saveSelection")}</Button>{requestType === "erasure" ? <Button variant="danger" onClick={() => void complete()}>{t("anonymise")}</Button> : <Button onClick={() => void downloadExport()}>{t("export")}</Button>}</PermissionGuard></div></> : <p className="text-sm text-admin-muted">{t("selectRequest")}</p>}</section>
  </div></div>;
}
