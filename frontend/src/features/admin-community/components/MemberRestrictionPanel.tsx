"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Loading } from "@/components/ui/Loading";
import { useToast } from "@/hooks/useToast";
import {
  AlertCircle,
  UserX,
  UserCheck,
  Search,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useAdminCommunityMutation } from "../queries";
import { communityAdminService } from "@/services/communityAdminService";
import { userAdminService } from "@/services/adminService";
import { CommunityAdminTabs } from "./CommunityAdminTabs";
import type { AdminUserOption } from "../types";
import type { User } from "@/types/entities";

export function MemberRestrictionPanel() {
  const t = useTranslations("Admin.community");
  const { toast } = useToast();

  const [selectedUser, setSelectedUser] = useState<AdminUserOption | null>(null);
  const [manualID, setManualID] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUserOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedDuration, setSelectedDuration] = useState<string>("7d");
  const [reason, setReason] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const effectiveUserID = selectedUser?.id || manualID.trim();

  const mutation = useAdminCommunityMutation(
    ({ action }: { action: "restrict" | "unrestrict" | "ban" }) =>
      communityAdminService.restrictMember(effectiveUserID, action, reason.trim()),
  );

  const handleSearchUsers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await userAdminService.getPaginated({
        search: query,
        page: 1,
        limit: 10,
        order: "desc",
        filters: {},
      });
      const users: AdminUserOption[] = (response.data || []).map((u: User) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        is_active: u.is_active,
        role: u.role ? { name: u.role.name } : undefined,
      }));
      setSearchResults(users);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: AdminUserOption) => {
    setSelectedUser(user);
    setManualID(user.id);
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleClearSelected = () => {
    setSelectedUser(null);
    setManualID("");
  };

  const submit = async (action: "restrict" | "unrestrict" | "ban") => {
    if (!effectiveUserID) {
      toast.error(t("memberIdPlaceholder"));
      return;
    }
    if (reason.trim().length < 2) {
      toast.error(t("reasonRequired"));
      return;
    }

    setActiveAction(action);
    try {
      await mutation.mutateAsync({ action });
      toast.success(t("decisionSaved"));
      setReason("");
      if (action === "unrestrict") {
        handleClearSelected();
      }
    } catch {
      toast.error(t("actionError"));
    } finally {
      setActiveAction(null);
    }
  };

  const durations = [
    { value: "24h", label: t("duration24h") },
    { value: "3d", label: t("duration3d") },
    { value: "7d", label: t("duration7d") },
    { value: "30d", label: t("duration30d") },
    { value: "permanent", label: t("durationPermanent") },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("title")}
        breadcrumbs={[
          { label: t("title"), href: "/admin/community" },
          { label: t("tabMembers") },
        ]}
      />

      {/* Sub-Navigation Tabs */}
      <CommunityAdminTabs />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left / Main Action Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* Member Search & Selection Box */}
          <div className="border border-admin-border bg-admin-surface p-6 space-y-5">
            <h2 className="text-base font-semibold text-admin-foreground flex items-center gap-2">
              <UserIcon size={18} className="text-admin-action" />
              <span>{t("selectMember")}</span>
            </h2>

            {selectedUser ? (
              <div className="flex items-center justify-between border border-admin-focus/40 bg-admin-selected/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center border border-admin-border bg-admin-surface text-admin-foreground font-semibold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-admin-foreground">
                      {selectedUser.name}
                    </p>
                    <p className="text-xs text-admin-muted font-mono">
                      {selectedUser.email}
                    </p>
                    <p className="text-xs text-admin-muted font-mono mt-0.5">
                      ID: {selectedUser.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelected}
                  className="border border-admin-border bg-admin-surface px-3 py-1.5 text-xs font-semibold text-admin-foreground hover:bg-admin-surface-muted"
                >
                  {t("changeMember")}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <form onSubmit={handleSearchUsers} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("searchMemberPlaceholder")}
                      className="min-h-11 w-full border border-admin-border bg-admin-canvas pl-9 pr-3 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="flex min-h-11 items-center gap-2 border border-admin-action bg-admin-action px-5 py-2 text-sm font-semibold text-admin-on-action hover:bg-admin-action-hover disabled:opacity-50"
                  >
                    {isSearching ? <Loading size="sm" /> : <Search size={16} />}
                    <span>{t("searchMember")}</span>
                  </button>
                </form>

                {/* Search Results Dropdown/List */}
                {searchResults.length > 0 && (
                  <div className="border border-admin-border bg-admin-canvas divide-y divide-admin-border max-h-60 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="flex w-full items-center justify-between p-3 text-left hover:bg-admin-surface-muted transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-sm text-admin-foreground">
                            {user.name}
                          </p>
                          <p className="text-xs text-admin-muted font-mono">
                            {user.email}
                          </p>
                        </div>
                        <span className="border border-admin-border bg-admin-surface px-2.5 py-1 text-xs font-semibold text-admin-action">
                          {t("selectMember")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Manual Fallback UUID Input */}
                <div className="pt-2 border-t border-admin-border">
                  <label className="block text-xs font-medium text-admin-muted">
                    {t("memberId")}
                    <input
                      type="text"
                      value={manualID}
                      onChange={(e) => setManualID(e.target.value)}
                      placeholder={t("memberIdPlaceholder")}
                      className="mt-1 min-h-10 w-full border border-admin-border bg-admin-canvas px-3 font-mono text-xs text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action and Reason Form */}
          <div className="border border-admin-border bg-admin-surface p-6 space-y-5">
            <h2 className="text-base font-semibold text-admin-foreground flex items-center gap-2">
              <Clock size={18} className="text-admin-warning" />
              <span>{t("penaltyModalTitle")}</span>
            </h2>

            {/* Duration Selector */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-admin-muted mb-2">
                {t("duration")}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {durations.map((dur) => (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => setSelectedDuration(dur.value)}
                    className={`min-h-11 border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus ${
                      selectedDuration === dur.value
                        ? "border-admin-focus bg-admin-selected text-admin-selected-foreground"
                        : "border-admin-border bg-admin-canvas text-admin-foreground hover:bg-admin-surface-muted"
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-sm font-medium text-admin-foreground">
                {t("reason")} <span className="text-admin-danger">*</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={t("reasonPlaceholder")}
                  className="mt-1.5 w-full border border-admin-border bg-admin-canvas px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted focus-visible:outline-2 focus-visible:outline-admin-focus"
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-admin-border pt-4 flex flex-wrap items-center gap-3">
              <PermissionGuard resource="community" action="restrict_members">
                <button
                  type="button"
                  disabled={mutation.isPending || !effectiveUserID}
                  onClick={() =>
                    void submit(
                      selectedDuration === "permanent" ? "ban" : "restrict",
                    )
                  }
                  className="flex min-h-11 items-center gap-2 border border-admin-warning bg-admin-warning/10 px-5 py-2 text-sm font-semibold text-admin-warning hover:bg-admin-warning/20 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
                >
                  {mutation.isPending &&
                  (activeAction === "restrict" || activeAction === "ban") ? (
                    <Loading size="sm" />
                  ) : (
                    <UserX size={16} />
                  )}
                  <span>
                    {selectedDuration === "permanent"
                      ? t("ban")
                      : t("restrict")}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={mutation.isPending || !effectiveUserID}
                  onClick={() => void submit("unrestrict")}
                  className="flex min-h-11 items-center gap-2 border border-admin-border bg-admin-surface px-5 py-2 text-sm font-semibold text-admin-foreground hover:bg-admin-surface-muted disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-admin-focus"
                >
                  {mutation.isPending && activeAction === "unrestrict" ? (
                    <Loading size="sm" />
                  ) : (
                    <UserCheck size={16} />
                  )}
                  <span>{t("unrestrict")}</span>
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Right / Guidance Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Guideline Banner */}
          <div className="border border-admin-border bg-admin-surface p-5 space-y-3">
            <div className="flex items-center gap-2 text-admin-warning font-semibold text-sm">
              <AlertCircle size={18} />
              <span>{t("memberGuideline")}</span>
            </div>
            <p className="text-xs leading-relaxed text-admin-muted">
              {t("memberGuideline")}
            </p>
          </div>

          {/* Policy Checklist */}
          <div className="border border-admin-border bg-admin-surface p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-admin-muted">
              {t("penaltyType")}
            </h3>
            <ul className="space-y-2 text-xs text-admin-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-admin-info shrink-0" />
                <span><strong>{t("restrict")}:</strong> จำกัดสิทธิ์ชั่วคราว ไม่สามารถตั้งกระทู้หรือตอบคำถามได้</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle size={14} className="mt-0.5 text-admin-danger shrink-0" />
                <span><strong>{t("ban")}:</strong> ระงับสิทธิ์ถาวร บัญชีจะถูกตัดสิทธิ์การใช้งานชุมชน</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-admin-success shrink-0" />
                <span><strong>{t("unrestrict")}:</strong> ปลดล็อกและคืนสิทธิ์การใช้งานตามปกติ</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
