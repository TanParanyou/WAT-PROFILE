"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Trash2,
  Download,
  Search,
  Mail,
  UserCheck,
  User,
  Calendar,
  MessageSquare,
  HeartHandshake,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  X,
  ChevronRight,
  Check,
  Clock,
  Ban,
  FileDown,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import { personalDataRequestService } from "@/services/personalDataRequestService";
import type {
  PersonalDataRequest,
  PersonalDataRequestItem,
  PrivacyRequestType,
  PrivacyAction,
} from "@/types/personal-data-request";

export default function PrivacyRequestsPage() {
  const t = useTranslations("Admin.privacyRequests");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Selected request state
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // List filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "verified" | "completed" | "rejected"
  >("all");

  // Create Request Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newMemberCode, setNewMemberCode] = useState("");
  const [newRequestType, setNewRequestType] =
    useState<PrivacyRequestType>("access");
  const [newNotes, setNewNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Verification Form State
  const [verifyMethod, setVerifyMethod] = useState<"in_person" | "email">(
    "in_person",
  );
  const [evidence, setEvidence] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Discovery / Items State
  const [candidates, setCandidates] = useState<PersonalDataRequestItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [candidateDomainTab, setCandidateDomainTab] = useState<string>("all");

  // Action / Completion States
  const [isExporting, setIsExporting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isErasureModalOpen, setIsErasureModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Info banner visibility
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Queries
  const requestsQuery = useQuery({
    queryKey: ["admin", "privacy-requests"],
    queryFn: personalDataRequestService.list,
  });

  const detailQuery = useQuery({
    queryKey: ["admin", "privacy-request", selectedId],
    queryFn: () => personalDataRequestService.get(selectedId!),
    enabled: Boolean(selectedId),
  });

  // Sync candidate items when request detail loads, or auto-scan if not yet saved
  useEffect(() => {
    const currentReq = detailQuery.data;
    if (!currentReq) return;

    if (currentReq.items && currentReq.items.length > 0) {
      setCandidates(currentReq.items);
    } else {
      let isCancelled = false;
      const autoSearch = async () => {
        try {
          setIsSearching(true);
          const email = currentReq.subject_email || "";
          const memberCode = currentReq.subject_member_code || "";
          const found = await personalDataRequestService.search(email, memberCode);
          if (isCancelled) return;

          const defaultAction: PrivacyAction =
            currentReq.request_type === "erasure" ? "anonymise" : "export";

          const mapped: PersonalDataRequestItem[] = found.map((item) => ({
            domain: item.domain,
            record_id: item.record_id,
            match_basis: item.match_basis,
            display_name: item.display_name,
            masked_email: item.masked_email,
            selected_action: defaultAction,
          }));

          setCandidates(mapped);
        } catch {
          // Ignore background auto-search failure
        } finally {
          if (!isCancelled) {
            setIsSearching(false);
          }
        }
      };

      autoSearch();
      return () => {
        isCancelled = true;
      };
    }
  }, [detailQuery.data]);

  // Reset local interactive states when switching requests
  const handleSelectRequest = (itemReq: PersonalDataRequest) => {
    setSelectedId(itemReq.id);
    setEvidence("");
    setVerifyMethod("in_person");
    setCandidateDomainTab("all");
    if (itemReq.items && itemReq.items.length > 0) {
      setCandidates(itemReq.items);
    } else {
      setCandidates([]);
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    const list = requestsQuery.data || [];
    return list.filter((req) => {
      const target = (
        req.subject_email ||
        req.subject_member_code ||
        ""
      ).toLowerCase();
      const matchesSearch =
        !searchQuery || target.includes(searchQuery.trim().toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "all") return true;
      if (statusFilter === "pending") {
        return (
          req.status === "open" ||
          req.status === "verification_pending" ||
          req.verification_status !== "verified"
        );
      }
      if (statusFilter === "verified") {
        return (
          req.verification_status === "verified" &&
          req.status !== "completed" &&
          req.status !== "rejected"
        );
      }
      if (statusFilter === "completed") {
        return req.status === "completed";
      }
      if (statusFilter === "rejected") {
        return req.status === "rejected";
      }
      return true;
    });
  }, [requestsQuery.data, searchQuery, statusFilter]);

  // Create Request Action
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() && !newMemberCode.trim()) {
      toast.error(t("emailPlaceholder"));
      return;
    }

    try {
      setIsCreating(true);
      const created = await personalDataRequestService.create({
        subject_email: newEmail.trim() || undefined,
        subject_member_code: newMemberCode.trim() || undefined,
        request_type: newRequestType,
        notes: newNotes.trim() || undefined,
      });

      toast.success(t("toastCreateSuccess"));
      setIsCreateModalOpen(false);
      setNewEmail("");
      setNewMemberCode("");
      setNewNotes("");
      setSelectedId(created.id);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "privacy-requests"],
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error.response?.data?.error || error.message || t("toastCreateSuccess"));
    } finally {
      setIsCreating(false);
    }
  };

  // Search system records
  const handleSearchSystem = async (showToast = true) => {
    const currentReq = detailQuery.data;
    if (!currentReq) return;

    try {
      setIsSearching(true);
      const email = currentReq.subject_email || "";
      const memberCode = currentReq.subject_member_code || "";
      const found = await personalDataRequestService.search(email, memberCode);

      const defaultAction: PrivacyAction =
        currentReq.request_type === "erasure" ? "anonymise" : "export";

      const mapped: PersonalDataRequestItem[] = found.map((item) => {
        const existing = (currentReq.items || []).find(
          (ex) => ex.domain === item.domain && ex.record_id === item.record_id,
        );
        return {
          domain: item.domain,
          record_id: item.record_id,
          match_basis: item.match_basis,
          display_name: item.display_name,
          masked_email: item.masked_email,
          selected_action:
            existing?.selected_action || defaultAction,
        };
      });

      setCandidates(mapped);
      if (showToast) {
        if (mapped.length === 0) {
          toast.info(t("noRecordsFound"));
        } else {
          toast.success(t("recordsFound", { count: mapped.length }));
        }
      }
    } catch (err: unknown) {
      if (showToast) {
        const error = err as { response?: { data?: { error?: string } }; message?: string };
        toast.error(error.response?.data?.error || error.message || t("search"));
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Verify Identity
  const handleVerify = async () => {
    if (!selectedId) return;
    if (!evidence.trim()) {
      toast.error(t("evidencePlaceholder"));
      return;
    }

    try {
      setIsVerifying(true);
      await personalDataRequestService.verify(
        selectedId,
        verifyMethod,
        evidence.trim(),
      );
      toast.success(t("toastVerifySuccess"));
      await detailQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: ["admin", "privacy-requests"],
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error.response?.data?.error || error.message || t("verify"));
    } finally {
      setIsVerifying(false);
    }
  };

  // Send Email Verification OTP
  const handleSendOtp = async () => {
    if (!selectedId) return;
    try {
      setIsSendingOtp(true);
      await personalDataRequestService.sendVerification(selectedId);
      toast.success(t("toastSendOtpSuccess"));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error.response?.data?.error || error.message || t("sendVerification"));
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Toggle Single Item Selection
  const handleToggleItem = (index: number, isChecked: boolean) => {
    const currentReqType = detailQuery.data?.request_type || "access";
    const defaultAction: PrivacyAction =
      currentReqType === "erasure" ? "anonymise" : "export";

    setCandidates((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              selected_action: isChecked ? defaultAction : ("" as const),
            }
          : row,
      ),
    );
  };

  // Select / Deselect All
  const handleSelectAll = (select: boolean) => {
    const currentReqType = detailQuery.data?.request_type || "access";
    const defaultAction: PrivacyAction =
      currentReqType === "erasure" ? "anonymise" : "export";

    setCandidates((prev) =>
      prev.map((row) => ({
        ...row,
        selected_action: select ? defaultAction : ("" as const),
      })),
    );
  };

  // Save Selected Items
  const handleSaveSelection = async () => {
    if (!selectedId) return;
    try {
      setIsSavingSelection(true);
      await personalDataRequestService.select(selectedId, candidates);
      toast.success(t("toastSaveSelectionSuccess"));
      await detailQuery.refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error.response?.data?.error || error.message || t("saveSelection"));
    } finally {
      setIsSavingSelection(false);
    }
  };

  // Export Data Download
  const handleDownloadExport = async () => {
    if (!selectedId) return;
    try {
      setIsExporting(true);
      const blob = await personalDataRequestService.export(selectedId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `personal-data-export-${selectedId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("toastExportSuccess"));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error.response?.data?.error || error.message || t("export"));
    } finally {
      setIsExporting(false);
    }
  };

  // Complete Erasure Action
  const handleCompleteErasure = async () => {
    if (!selectedId) return;
    try {
      setIsCompleting(true);
      const res = await personalDataRequestService.complete(selectedId);
      toast.success(t("toastErasureSuccess", { count: res.affected_count }));
      setIsErasureModalOpen(false);
      await detailQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: ["admin", "privacy-requests"],
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error.response?.data?.error || error.message || t("anonymise"));
    } finally {
      setIsCompleting(false);
    }
  };

  // Reject Request Action
  const handleRejectRequest = async () => {
    if (!selectedId) return;
    try {
      setIsRejecting(true);
      await personalDataRequestService.reject(selectedId);
      toast.success(t("toastRejectSuccess"));
      setIsRejectModalOpen(false);
      await detailQuery.refetch();
      await queryClient.invalidateQueries({
        queryKey: ["admin", "privacy-requests"],
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(error.response?.data?.error || error.message || t("reject"));
    } finally {
      setIsRejecting(false);
    }
  };

  // Helpers for domain labels and icons using strict admin theme tokens
  const getDomainInfo = (domain: string) => {
    switch (domain) {
      case "member":
        return {
          label: t("domainMember"),
          icon: Users,
          color: "border border-admin-info bg-admin-info-surface text-admin-info",
        };
      case "donation":
        return {
          label: t("domainDonation"),
          icon: HeartHandshake,
          color: "border border-admin-warning bg-admin-warning-surface text-admin-warning",
        };
      case "event_registration":
        return {
          label: t("domainEvent"),
          icon: Calendar,
          color: "border border-admin-info bg-admin-info-surface text-admin-info",
        };
      case "contact_inquiry":
        return {
          label: t("domainContact"),
          icon: MessageSquare,
          color: "border border-admin-warning bg-admin-warning-surface text-admin-warning",
        };
      case "user":
        return {
          label: t("domainUser"),
          icon: User,
          color: "border border-admin-border bg-admin-surface-muted text-admin-foreground",
        };
      default:
        return {
          label: domain,
          icon: FileText,
          color: "border border-admin-border bg-admin-surface-muted text-admin-foreground",
        };
    }
  };

  // Filtered candidate list based on domain tab
  const filteredCandidates = useMemo(() => {
    if (candidateDomainTab === "all") return candidates;
    return candidates.filter((item) => item.domain === candidateDomainTab);
  }, [candidates, candidateDomainTab]);

  const selectedCount = useMemo(() => {
    return candidates.filter((item) => Boolean(item.selected_action)).length;
  }, [candidates]);

  const req = detailQuery.data;
  const isVerified = req?.verification_status === "verified";
  const isCompleted = req?.status === "completed";
  const isRejected = req?.status === "rejected";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <AdminPageHeader
        title={t("title")}
        breadcrumbs={[{ label: t("title") }]}
        actions={
          <PermissionGuard resource="privacy_requests" action="create">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2 rounded-none"
            >
              <Plus className="h-4 w-4" />
              {t("newRequest")}
            </Button>
          </PermissionGuard>
        }
      />

      {/* Info Banner */}
      {showInfoBanner && (
        <div className="relative flex items-start gap-4 rounded-none border border-admin-info bg-admin-info-surface p-4 text-sm text-admin-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-admin-info" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-admin-foreground">{t("title")}</p>
            <p className="text-xs text-admin-muted leading-relaxed">
              {t("subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfoBanner(false)}
            className="rounded-none p-1 text-admin-muted hover:bg-admin-surface-muted hover:text-admin-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Layout: Master (List) & Detail Panel */}
      <div className="grid gap-6 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        {/* Left Column: Request List & Filters */}
        <section className="flex flex-col rounded-none border border-admin-border bg-admin-surface">
          {/* List Search & Filter Header */}
          <div className="border-b border-admin-border p-4 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-none border border-admin-control-border bg-admin-surface py-2 pl-9 pr-3 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-admin-focus"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1">
              {[
                { key: "all", label: t("filterAll") },
                { key: "pending", label: t("filterPending") },
                { key: "verified", label: t("filterVerified") },
                { key: "completed", label: t("filterCompleted") },
                { key: "rejected", label: t("filterRejected") },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      tab.key as
                        | "all"
                        | "pending"
                        | "verified"
                        | "completed"
                        | "rejected",
                    )
                  }
                  className={`rounded-none px-2.5 py-1 text-xs font-medium transition ${
                    statusFilter === tab.key
                      ? "bg-admin-action text-admin-on-action"
                      : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Request Cards List */}
          <div className="max-h-[calc(100vh-320px)] min-h-[300px] overflow-y-auto divide-y divide-admin-border p-2">
            {requestsQuery.isLoading ? (
              <div className="py-12 flex justify-center">
                <Loading size="md" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-12 text-center text-sm text-admin-muted space-y-2">
                <FileText className="mx-auto h-8 w-8 text-admin-muted" />
                <p>
                  {searchQuery ? t("noRecordsFound") : t("selectRequestDesc")}
                </p>
              </div>
            ) : (
              filteredRequests.map((row) => {
                const isSelected = row.id === selectedId;
                const isItemVerified = row.verification_status === "verified";
                const isItemCompleted = row.status === "completed";
                const isItemRejected = row.status === "rejected";

                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => handleSelectRequest(row)}
                    className={`w-full rounded-none p-3.5 text-left transition border ${
                      isSelected
                        ? "border-admin-action bg-admin-surface-muted"
                        : "border-transparent hover:bg-admin-surface-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {/* Request Type Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-xs font-medium ${
                          row.request_type === "erasure"
                            ? "border border-admin-warning bg-admin-warning-surface text-admin-warning"
                            : "border border-admin-info bg-admin-info-surface text-admin-info"
                        }`}
                      >
                        {row.request_type === "erasure" ? (
                          <Trash2 className="h-3 w-3" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        {row.request_type === "erasure"
                          ? t("erasureShort")
                          : t("accessShort")}
                      </span>

                      {/* Status / Verification indicator */}
                      <div className="flex items-center gap-1.5">
                        {isItemCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t("statusCompleted")}
                          </span>
                        ) : isItemRejected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-danger">
                            <Ban className="h-3.5 w-3.5" />
                            {t("statusRejected")}
                          </span>
                        ) : isItemVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-success">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t("verifiedStatus")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-admin-warning">
                            <Clock className="h-3.5 w-3.5" />
                            {t("statusVerificationPending")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subject Target */}
                    <div className="font-semibold text-sm text-admin-foreground truncate">
                      {row.subject_email || row.subject_member_code}
                    </div>
                    {row.subject_email && row.subject_member_code && (
                      <div className="text-xs text-admin-muted truncate mt-0.5">
                        {row.subject_member_code}
                      </div>
                    )}

                    {/* Date */}
                    <div className="mt-2 flex items-center justify-between text-xs text-admin-muted">
                      <span>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString()
                          : ""}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-admin-muted" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column: Interactive Processing Workflow Panel */}
        <section className="rounded-none border border-admin-border bg-admin-surface p-6">
          {!selectedId ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center p-8 text-admin-muted">
              <ShieldCheck className="h-12 w-12 text-admin-muted mb-3" />
              <h3 className="text-base font-semibold text-admin-foreground">
                {t("selectRequest")}
              </h3>
              <p className="mt-1 text-xs max-w-sm text-admin-muted leading-relaxed">
                {t("selectRequestDesc")}
              </p>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="py-20 flex justify-center">
              <Loading size="lg" />
            </div>
          ) : req ? (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-admin-border pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-admin-foreground">
                      {req.subject_email || req.subject_member_code}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-none px-2.5 py-0.5 text-xs font-semibold ${
                        req.request_type === "erasure"
                          ? "border border-admin-warning bg-admin-warning-surface text-admin-warning"
                          : "border border-admin-info bg-admin-info-surface text-admin-info"
                      }`}
                    >
                      {req.request_type === "erasure" ? (
                        <Trash2 className="h-3 w-3" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                      {req.request_type === "erasure"
                        ? t("erasureShort")
                        : t("accessShort")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-admin-muted">
                    ID: <code className="font-mono">{req.id}</code> ·{" "}
                    {t("requestedAt")}:{" "}
                    {req.created_at
                      ? new Date(req.created_at).toLocaleString()
                      : "-"}
                  </p>
                </div>

                {/* Status Badges & Reject Action */}
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 rounded-none border border-admin-success bg-admin-success-surface px-3 py-1 text-xs font-semibold text-admin-success">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("statusCompleted")}
                    </span>
                  ) : isRejected ? (
                    <span className="inline-flex items-center gap-1.5 rounded-none border border-admin-danger bg-admin-danger-surface px-3 py-1 text-xs font-semibold text-admin-danger">
                      <Ban className="h-4 w-4" />
                      {t("statusRejected")}
                    </span>
                  ) : (
                    <PermissionGuard resource="privacy_requests" action="update">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRejectModalOpen(true)}
                        className="rounded-none border-admin-danger text-admin-danger hover:bg-admin-danger-surface"
                      >
                        <Ban className="mr-1.5 h-3.5 w-3.5" />
                        {t("reject")}
                      </Button>
                    </PermissionGuard>
                  )}
                </div>
              </div>

              {/* Step 1: Request Overview */}
              <div className="rounded-none border border-admin-border bg-admin-surface-muted p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-admin-muted mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-admin-muted" />
                  {t("step1")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-admin-muted block">
                      {t("emailPlaceholder")}
                    </span>
                    <span className="font-medium text-admin-foreground">
                      {req.subject_email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-admin-muted block">
                      {t("memberCodePlaceholder")}
                    </span>
                    <span className="font-medium text-admin-foreground">
                      {req.subject_member_code || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-admin-muted block">
                      {t("requestType")}
                    </span>
                    <span className="font-medium text-admin-foreground">
                      {req.request_type === "erasure"
                        ? t("erasure")
                        : t("access")}
                    </span>
                  </div>
                </div>
                {req.notes && (
                  <div className="mt-3 pt-3 border-t border-admin-border text-xs">
                    <span className="text-admin-muted font-medium block">
                      {t("notesLabel")}:
                    </span>
                    <p className="mt-0.5 text-admin-foreground">{req.notes}</p>
                  </div>
                )}
              </div>

              {/* Step 2: Identity Verification */}
              <div className="rounded-none border border-admin-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-admin-muted flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-admin-muted" />
                    {t("step2")}
                  </h3>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-admin-success">
                      <ShieldCheck className="h-4 w-4" />
                      {t("verifiedStatus")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-admin-warning">
                      <AlertTriangle className="h-4 w-4" />
                      {t("unverifiedStatus")}
                    </span>
                  )}
                </div>

                {isVerified ? (
                  <div className="rounded-none border border-admin-success bg-admin-success-surface p-3 text-xs text-admin-success flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-admin-success" />
                    <div>
                      <p className="font-semibold">{t("verifiedStatus")}</p>
                      <p className="mt-0.5">
                        {t("selectMethod")}:{" "}
                        <strong>
                          {req.verification_method === "email"
                            ? t("emailVerification")
                            : t("inPerson")}
                        </strong>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-admin-muted leading-relaxed">
                      {t("verificationRequiredDesc")}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-admin-muted mb-1 block">
                          {t("selectMethod")}
                        </label>
                        <select
                          value={verifyMethod}
                          onChange={(e) =>
                            setVerifyMethod(
                              e.target.value as "in_person" | "email",
                            )
                          }
                          className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-admin-focus"
                        >
                          <option value="in_person">{t("inPerson")}</option>
                          <option value="email">
                            {t("emailVerification")}
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-admin-muted mb-1 block">
                          {t("evidenceLabel")}
                        </label>
                        <input
                          type="text"
                          value={evidence}
                          onChange={(e) => setEvidence(e.target.value)}
                          placeholder={t("evidencePlaceholder")}
                          className="min-h-11 w-full rounded-none border border-admin-control-border bg-admin-surface px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-admin-focus"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {verifyMethod === "email" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleSendOtp()}
                          isLoading={isSendingOtp}
                          disabled={!req.subject_email}
                          className="gap-1.5 rounded-none"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {t("sendVerification")}
                        </Button>
                      )}

                      <PermissionGuard
                        resource="privacy_requests"
                        action="update"
                      >
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleVerify()}
                          isLoading={isVerifying}
                          className="gap-1.5 rounded-none"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          {t("verify")}
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Discovered System Records */}
              <div className="rounded-none border border-admin-border p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-admin-muted flex items-center gap-2">
                      <Search className="h-4 w-4 text-admin-muted" />
                      {t("step3")}
                    </h3>
                    <p className="mt-0.5 text-xs text-admin-muted">
                      {candidates.length > 0
                        ? t("selectedCount", {
                            selected: selectedCount,
                            total: candidates.length,
                          })
                        : t("noRecordsFound")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSearchSystem()}
                      isLoading={isSearching}
                      className="gap-1.5 rounded-none"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t("scanSystem")}
                    </Button>
                  </div>
                </div>

                {/* Accounting Safety Notice if donation records present */}
                {candidates.some((item) => item.domain === "donation") && (
                  <div className="rounded-none border border-admin-warning bg-admin-warning-surface p-3 text-xs text-admin-warning flex items-start gap-2.5">
                    <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-admin-warning" />
                    <p className="leading-relaxed">{t("donationNotice")}</p>
                  </div>
                )}

                {/* Candidate Domain Filter Tabs */}
                {candidates.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-admin-border">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setCandidateDomainTab("all")}
                        className={`rounded-none px-2 py-0.5 text-xs font-medium transition ${
                          candidateDomainTab === "all"
                            ? "bg-admin-action text-admin-on-action"
                            : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                        }`}
                      >
                        {t("filterAll")} ({candidates.length})
                      </button>
                      {Array.from(
                        new Set(candidates.map((item) => item.domain)),
                      ).map((domain) => {
                        const info = getDomainInfo(domain);
                        const count = candidates.filter(
                          (item) => item.domain === domain,
                        ).length;
                        return (
                          <button
                            key={domain}
                            type="button"
                            onClick={() => setCandidateDomainTab(domain)}
                            className={`rounded-none px-2 py-0.5 text-xs font-medium transition ${
                              candidateDomainTab === domain
                                ? "bg-admin-action text-admin-on-action"
                                : "bg-admin-surface-muted text-admin-muted hover:text-admin-foreground"
                            }`}
                          >
                            {info.label} ({count})
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSelectAll(true)}
                        className="text-admin-foreground hover:underline"
                      >
                        {t("selectAll")}
                      </button>
                      <span className="text-admin-muted">·</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(false)}
                        className="text-admin-muted hover:text-admin-foreground"
                      >
                        {t("deselectAll")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Candidate Records List */}
                {isSearching ? (
                  <div className="rounded-none border border-dashed border-admin-border p-8 text-center text-xs text-admin-muted flex flex-col items-center justify-center gap-2">
                    <Loading size="sm" />
                    <span>{t("scanning")}</span>
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="rounded-none border border-dashed border-admin-border p-6 text-center text-xs text-admin-muted">
                    <Search className="mx-auto h-6 w-6 text-admin-muted mb-2" />
                    <p>{t("noRecordsFound")}</p>
                    <p className="mt-1 text-xs text-admin-muted">
                      {t("scanHelp")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto">
                    {filteredCandidates.map((item) => {
                      const originalIndex = candidates.findIndex(
                        (c) =>
                          c.domain === item.domain &&
                          c.record_id === item.record_id,
                      );
                      const domainInfo = getDomainInfo(item.domain);
                      const DomainIcon = domainInfo.icon;
                      const isChecked = Boolean(item.selected_action);

                      return (
                        <label
                          key={`${item.domain}-${item.record_id}`}
                          className={`flex items-center gap-3.5 rounded-none border p-3 text-xs transition cursor-pointer ${
                            isChecked
                              ? "border-admin-action bg-admin-surface-muted"
                              : "border-admin-border bg-admin-surface hover:bg-admin-surface-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              handleToggleItem(originalIndex, e.target.checked)
                            }
                            className="h-4 w-4 rounded-none border-admin-control-border text-admin-action focus:ring-admin-focus"
                          />

                          {/* Domain Badge */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-none px-2 py-0.5 text-xs font-medium shrink-0 ${domainInfo.color}`}
                          >
                            <DomainIcon className="h-3 w-3" />
                            {domainInfo.label}
                          </span>

                          {/* Display info */}
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-admin-foreground truncate block">
                              {item.display_name || item.record_id}
                            </span>
                            <span className="text-admin-muted text-xs font-mono">
                              ID: {item.record_id}
                              {item.masked_email
                                ? ` · ${item.masked_email}`
                                : ""}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Save Selection Button */}
                {candidates.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <PermissionGuard
                      resource="privacy_requests"
                      action="update"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleSaveSelection()}
                        isLoading={isSavingSelection}
                        className="gap-1.5 rounded-none"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {t("saveSelection")}
                      </Button>
                    </PermissionGuard>
                  </div>
                )}
              </div>

              {/* Step 4: Action & Completion */}
              <div className="rounded-none border border-admin-border bg-admin-surface-muted p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-admin-muted flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-admin-muted" />
                  {t("step4")}
                </h3>

                {isCompleted ? (
                  <div className="rounded-none border border-admin-success bg-admin-success-surface p-4 text-xs text-admin-success flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-admin-success" />
                    <div>
                      <p className="font-bold text-sm">
                        {t("statusCompleted")}
                      </p>
                      <p className="mt-0.5">
                        คำขอนี้ได้รับการดำเนินการเรียบร้อยแล้ว
                      </p>
                    </div>
                  </div>
                ) : isRejected ? (
                  <div className="rounded-none border border-admin-danger bg-admin-danger-surface p-4 text-xs text-admin-danger flex items-center gap-3">
                    <Ban className="h-5 w-5 shrink-0 text-admin-danger" />
                    <div>
                      <p className="font-bold text-sm">{t("statusRejected")}</p>
                      <p className="mt-0.5">คำขอนี้ถูกปฏิเสธแล้ว</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-admin-muted max-w-md">
                      {req.request_type === "erasure" ? (
                        <p>{t("erasureHelp")}</p>
                      ) : (
                        <p>{t("exportHelp")}</p>
                      )}
                    </div>

                    <PermissionGuard
                      resource="privacy_requests"
                      action="update"
                    >
                      {req.request_type === "erasure" ? (
                        <Button
                          variant="danger"
                          onClick={() => setIsErasureModalOpen(true)}
                          disabled={!isVerified || selectedCount === 0}
                          className="gap-2 rounded-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("anonymise")}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => void handleDownloadExport()}
                          isLoading={isExporting}
                          disabled={!isVerified}
                          className="gap-2 rounded-none"
                        >
                          <FileDown className="h-4 w-4" />
                          {t("export")}
                        </Button>
                      )}
                    </PermissionGuard>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {/* Modal: Create New Request */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t("newRequest")}
        description={t("subtitle")}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-none"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={(e) => void handleCreateRequest(e)}
              isLoading={isCreating}
              className="rounded-none"
            >
              {t("create")}
            </Button>
          </div>
        }
      >
        <form
          onSubmit={(e) => void handleCreateRequest(e)}
          className="space-y-4 pt-1 text-sm"
        >
          {/* Request Type Selector */}
          <div>
            <label className="text-xs font-semibold text-admin-foreground block mb-2">
              {t("requestType")}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col gap-1 rounded-none border p-3 cursor-pointer transition ${
                  newRequestType === "access"
                    ? "border-admin-action bg-admin-surface-muted"
                    : "border-admin-border hover:bg-admin-surface-muted"
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-admin-foreground">
                  <input
                    type="radio"
                    name="requestType"
                    value="access"
                    checked={newRequestType === "access"}
                    onChange={() => setNewRequestType("access")}
                    className="text-admin-action"
                  />
                  <span>{t("accessShort")}</span>
                </div>
                <span className="text-xs text-admin-muted pl-5">
                  {t("accessDesc")}
                </span>
              </label>

              <label
                className={`flex flex-col gap-1 rounded-none border p-3 cursor-pointer transition ${
                  newRequestType === "erasure"
                    ? "border-admin-warning bg-admin-warning-surface"
                    : "border-admin-border hover:bg-admin-surface-muted"
                }`}
              >
                <div className="flex items-center gap-2 font-medium text-admin-foreground">
                  <input
                    type="radio"
                    name="requestType"
                    value="erasure"
                    checked={newRequestType === "erasure"}
                    onChange={() => setNewRequestType("erasure")}
                    className="text-admin-warning"
                  />
                  <span>{t("erasureShort")}</span>
                </div>
                <span className="text-xs text-admin-muted pl-5">
                  {t("erasureDesc")}
                </span>
              </label>
            </div>
          </div>

          <Input
            label={t("emailPlaceholder")}
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@example.com"
          />

          <Input
            label={t("memberCodePlaceholder")}
            type="text"
            value={newMemberCode}
            onChange={(e) => setNewMemberCode(e.target.value)}
            placeholder="M-10023"
          />

          <Textarea
            label={t("notesLabel")}
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            rows={3}
          />
        </form>
      </Modal>

      {/* Confirmation Modal: Erasure / Anonymisation */}
      <ConfirmModal
        isOpen={isErasureModalOpen}
        onClose={() => setIsErasureModalOpen(false)}
        onConfirm={handleCompleteErasure}
        title={t("confirmErasureTitle")}
        message={t("confirmErasureDesc", { count: selectedCount })}
        confirmText={t("anonymise")}
        cancelText={t("cancel")}
        variant="danger"
        isLoading={isCompleting}
      />

      {/* Confirmation Modal: Reject Request */}
      <ConfirmModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectRequest}
        title={t("confirmRejectTitle")}
        message={t("confirmRejectDesc")}
        confirmText={t("reject")}
        cancelText={t("cancel")}
        variant="danger"
        isLoading={isRejecting}
      />
    </div>
  );
}
