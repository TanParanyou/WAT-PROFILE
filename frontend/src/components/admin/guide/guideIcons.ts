import React from "react";
import type { GuideStatusBadgeVariant } from "@/types/adminGuide";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  User,
  BookOpen,
  Phone,
  FileText,
  ShieldCheck,
  FolderOpen,
  MessageCircleQuestion,
  CalendarDays,
  Calendar,
  ClipboardList,
  Clock,
  Image,
  Users,
  UserCheck,
  HandCoins,
  Mail,
  FileKey,
  UserCog,
  UserRoundCheck,
  Shield,
  Activity,
  Settings,
  Compass,
  Globe,
  HelpCircle,
} from "lucide-react";

export const guideIconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  User,
  BookOpen,
  Phone,
  FileText,
  ShieldCheck,
  FolderOpen,
  MessageCircleQuestion,
  CalendarDays,
  Calendar,
  ClipboardList,
  Clock,
  Image,
  Users,
  UserCheck,
  HandCoins,
  Mail,
  FileKey,
  UserCog,
  UserRoundCheck,
  Shield,
  Activity,
  Settings,
  Compass,
  Globe,
};

export function GuideIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const IconComponent = guideIconMap[name] || HelpCircle;
  return React.createElement(IconComponent, { size, className });
}

export function getStatusBadgeClasses(variant: GuideStatusBadgeVariant): string {
  switch (variant) {
    case "success":
      return "bg-admin-success-surface text-admin-success border-admin-success/30";
    case "warning":
      return "bg-admin-warning-surface text-admin-warning border-admin-warning/30";
    case "danger":
      return "bg-admin-danger-surface text-admin-danger border-admin-danger/30";
    case "info":
      return "bg-admin-surface-muted text-admin-foreground border-admin-border";
    case "default":
    default:
      return "bg-admin-surface-muted text-admin-muted border-admin-border";
  }
}
