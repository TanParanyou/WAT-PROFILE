"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { X, User, Phone, MapPin, Shield, Calendar, Edit3, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { memberAdminService } from "@/services/adminService";
import { useToast } from "@/hooks/useToast";
import type { Member } from "@/types/entities";
import { cn } from "@/utils/cn";

interface AdminMemberDrawerProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface MemberFormData {
  first_name_th: string;
  last_name_th: string;
  first_name_en: string;
  last_name_en: string;
  phone: string;
  line_id: string;
  gender: string;
  nationality: string;
  birth_date: string;
  address_th: string;
  address_en: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  membership_type: string;
  membership_status: string;
  notes: string;
}

export function AdminMemberDrawer({
  isOpen,
  member,
  onClose,
  onSuccess,
}: AdminMemberDrawerProps) {
  const t = useTranslations("Admin");
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const typeOptions = [
    { value: "general", label: t("members.types.general") || "General" },
    { value: "monk", label: t("members.types.monk") || "Monk" },
    { value: "layperson", label: t("members.types.layperson") || "Layperson" },
    { value: "vip", label: t("members.types.vip") || "VIP" },
    { value: "lifetime", label: "Lifetime" },
  ];

  const statusOptions = [
    { value: "active", label: t("members.status.active") || "Active" },
    { value: "pending", label: t("members.status.pending") || "Pending" },
    { value: "inactive", label: t("members.status.inactive") || "Inactive" },
  ];

  const genderOptions = [
    { value: "", label: "-" },
    { value: "male", label: "ชาย (Male)" },
    { value: "female", label: "หญิง (Female)" },
    { value: "other", label: "อื่นๆ (Other)" },
  ];

  const { control, register, handleSubmit, reset, formState: { isDirty } } = useForm<MemberFormData>({
    defaultValues: {
      first_name_th: "",
      last_name_th: "",
      first_name_en: "",
      last_name_en: "",
      phone: "",
      line_id: "",
      gender: "",
      nationality: "",
      birth_date: "",
      address_th: "",
      address_en: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      membership_type: "general",
      membership_status: "active",
      notes: "",
    },
  });

  useEffect(() => {
    if (member) {
      reset({
        first_name_th: member.first_name_th || "",
        last_name_th: member.last_name_th || "",
        first_name_en: member.first_name_en || "",
        last_name_en: member.last_name_en || "",
        phone: member.phone || "",
        line_id: member.line_id || "",
        gender: member.gender || "",
        nationality: member.nationality || "",
        birth_date: member.birth_date ? member.birth_date.split("T")[0] : "",
        address_th: member.address_th || "",
        address_en: member.address_en || "",
        emergency_contact_name: member.emergency_contact_name || "",
        emergency_contact_phone: member.emergency_contact_phone || "",
        membership_type: member.membership_type || "general",
        membership_status: member.membership_status || "active",
        notes: member.notes || "",
      });
      setIsEditing(false);
    }
  }, [member, reset]);

  if (!isOpen || !member) return null;

  const onSubmit = async (data: MemberFormData) => {
    setIsSaving(true);
    try {
      await memberAdminService.update(member.id, {
        ...data,
        birth_date: data.birth_date || null,
      } as Partial<Member>);
      toast.success(t("common.success"));
      setIsEditing(false);
      onSuccess();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsSaving(false);
    }
  };

  const fullNameTH = `${member.first_name_th || ""} ${member.last_name_th || ""}`.trim() || "-";
  const fullNameEN = `${member.first_name_en || ""} ${member.last_name_en || ""}`.trim() || "-";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-admin-surface border-l border-admin-border shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 border-b border-admin-border flex items-center justify-between bg-admin-surface sticky top-0 z-10">
            <div className="flex items-center gap-3">
              {member.profile_image_url ? (
                <img
                  src={member.profile_image_url}
                  alt={fullNameTH}
                  className="w-12 h-12 rounded-full object-cover border border-admin-border"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-admin-surface-muted border border-admin-border flex items-center justify-center text-admin-muted">
                  <User size={24} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-admin-foreground">
                    {fullNameTH}
                  </h2>
                  <StatusBadge label={member.membership_status} />
                </div>
                <p className="text-xs text-admin-muted font-mono">
                  {member.member_code || `ID: #${member.id}`} • {fullNameEN}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PermissionGuard resource="members" action="update">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Edit3 size={14} />
                    <span>{t("common.edit")}</span>
                  </Button>
                )}
              </PermissionGuard>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-admin-muted hover:text-admin-foreground rounded transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {/* Section 1: Membership Status & Type */}
            <div className="p-4 bg-admin-surface-muted/40 border border-admin-border space-y-4">
              <h3 className="text-xs font-semibold text-admin-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} className="text-admin-muted" />
                <span>สถานะและประเภทสมาชิก</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <Controller
                      control={control}
                      name="membership_type"
                      render={({ field }) => (
                        <Select
                          id="membership_type"
                          label={t("common.filter.memberType")}
                          options={typeOptions}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="membership_status"
                      render={({ field }) => (
                        <Select
                          id="membership_status"
                          label={t("common.filter.memberStatus")}
                          options={statusOptions}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    />
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-xs text-admin-muted block">ประเภทสมาชิก</span>
                      <span className="text-sm font-medium text-admin-foreground uppercase">
                        {member.membership_type || "general"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-admin-muted block">วันที่เริ่มเป็นสมาชิก</span>
                      <span className="text-sm font-medium text-admin-foreground">
                        {member.membership_date
                          ? new Date(member.membership_date).toLocaleDateString("th-TH")
                          : "-"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 2: Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-admin-foreground uppercase tracking-wider border-b border-admin-border pb-2 flex items-center gap-1.5">
                <User size={14} className="text-admin-muted" />
                <span>ข้อมูลส่วนตัว (Personal Details)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <Input
                      id="first_name_th"
                      label="ชื่อ (ภาษาไทย)"
                      {...register("first_name_th")}
                    />
                    <Input
                      id="last_name_th"
                      label="นามสกุล (ภาษาไทย)"
                      {...register("last_name_th")}
                    />
                    <Input
                      id="first_name_en"
                      label="First Name (English)"
                      {...register("first_name_en")}
                    />
                    <Input
                      id="last_name_en"
                      label="Last Name (English)"
                      {...register("last_name_en")}
                    />
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <Select
                          id="gender"
                          label="เพศ (Gender)"
                          options={genderOptions}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      )}
                    />
                    <Input
                      id="nationality"
                      label="สัญชาติ (Nationality)"
                      {...register("nationality")}
                    />
                    <Input
                      id="birth_date"
                      type="date"
                      label="วันเกิด (Birth Date)"
                      {...register("birth_date")}
                    />
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-xs text-admin-muted block">ชื่อ-นามสกุล (ไทย)</span>
                      <span className="text-sm text-admin-foreground">{fullNameTH}</span>
                    </div>
                    <div>
                      <span className="text-xs text-admin-muted block">Name-Surname (EN)</span>
                      <span className="text-sm text-admin-foreground">{fullNameEN}</span>
                    </div>
                    <div>
                      <span className="text-xs text-admin-muted block">เพศ / สัญชาติ</span>
                      <span className="text-sm text-admin-foreground">
                        {member.gender || "-"} / {member.nationality || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-admin-muted block">วันเกิด</span>
                      <span className="text-sm text-admin-foreground">
                        {member.birth_date
                          ? new Date(member.birth_date).toLocaleDateString("th-TH")
                          : "-"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 3: Contact & Address */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-admin-foreground uppercase tracking-wider border-b border-admin-border pb-2 flex items-center gap-1.5">
                <Phone size={14} className="text-admin-muted" />
                <span>ข้อมูลติดต่อและที่อยู่ (Contact & Address)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <Input id="phone" label={t("columns.phone")} {...register("phone")} />
                    <Input id="line_id" label="Line ID" {...register("line_id")} />
                    <div className="sm:col-span-2">
                      <Textarea
                        id="address_th"
                        label="ที่อยู่ (ไทย)"
                        rows={2}
                        {...register("address_th")}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Textarea
                        id="address_en"
                        label="Address (English / Germany)"
                        rows={2}
                        {...register("address_en")}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-xs text-admin-muted block">เบอร์โทรศัพท์</span>
                      <span className="text-sm text-admin-foreground">{member.phone || "-"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-admin-muted block">Line ID</span>
                      <span className="text-sm text-admin-foreground">{member.line_id || "-"}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-admin-muted block">ที่อยู่</span>
                      <span className="text-sm text-admin-foreground whitespace-pre-wrap">
                        {member.address_th || member.address_en || "-"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 4: Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-admin-foreground uppercase tracking-wider border-b border-admin-border pb-2 flex items-center gap-1.5">
                <Phone size={14} className="text-admin-muted" />
                <span>ผู้ติดต่อกรณีฉุกเฉิน (Emergency Contact)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isEditing ? (
                  <>
                    <Input
                      id="emergency_contact_name"
                      label="ชื่อผู้ติดต่อฉุกเฉิน"
                      {...register("emergency_contact_name")}
                    />
                    <Input
                      id="emergency_contact_phone"
                      label="เบอร์โทรฉุกเฉิน"
                      {...register("emergency_contact_phone")}
                    />
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-xs text-admin-muted block">ชื่อผู้ติดต่อฉุกเฉิน</span>
                      <span className="text-sm text-admin-foreground">
                        {member.emergency_contact_name || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-admin-muted block">เบอร์โทรฉุกเฉิน</span>
                      <span className="text-sm text-admin-foreground">
                        {member.emergency_contact_phone || "-"}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Section 5: Admin Notes */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-admin-foreground uppercase tracking-wider border-b border-admin-border pb-2">
                หมายเหตุภายใน (Admin Notes)
              </h3>

              {isEditing ? (
                <Textarea
                  id="notes"
                  label="บันทึกเพิ่มเติมสำหรับเจ้าหน้าที่"
                  rows={3}
                  placeholder="เช่น ประวัติการมาวัด, ข้อควรระวังด้านสุขภาพ..."
                  {...register("notes")}
                />
              ) : (
                <p className="text-sm text-admin-muted italic bg-admin-surface-muted p-3 border border-admin-border">
                  {member.notes || "ไม่มีบันทึกเพิ่มเติม"}
                </p>
              )}
            </div>

            {/* Edit Mode Actions Footer */}
            {isEditing && (
              <div className="sticky bottom-0 bg-admin-surface/95 backdrop-blur-sm border-t border-admin-border pt-4 -mx-6 px-6 flex items-center justify-end gap-3 z-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  className="inline-flex items-center gap-1.5"
                >
                  <Check size={16} />
                  <span>{t("common.save")}</span>
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
