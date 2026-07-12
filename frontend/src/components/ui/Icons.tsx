"use client";

import React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Save,
  Clock,
  MapPin,
  Download,
  ArrowLeft,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";

export interface IconProps extends React.ComponentPropsWithoutRef<"svg"> {
  size?: number;
}

export const Icons = {
  Plus: ({ size = 16, className, ...props }: IconProps) => (
    <Plus size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Edit: ({ size = 16, className, ...props }: IconProps) => (
    <Pencil size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Delete: ({ size = 16, className, ...props }: IconProps) => (
    <Trash2 size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  View: ({ size = 16, className, ...props }: IconProps) => (
    <Eye size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Close: ({ size = 16, className, ...props }: IconProps) => (
    <X size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Save: ({ size = 16, className, ...props }: IconProps) => (
    <Save size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Clock: ({ size = 16, className, ...props }: IconProps) => (
    <Clock size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Location: ({ size = 16, className, ...props }: IconProps) => (
    <MapPin size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Download: ({ size = 16, className, ...props }: IconProps) => (
    <Download size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Back: ({ size = 16, className, ...props }: IconProps) => (
    <ArrowLeft size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  Drag: ({ size = 16, className, ...props }: IconProps) => (
    <GripVertical size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  ArrowUp: ({ size = 16, className, ...props }: IconProps) => (
    <ArrowUp size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  ArrowDown: ({ size = 16, className, ...props }: IconProps) => (
    <ArrowDown size={size} strokeWidth={1.5} className={className} {...props} />
  ),
  FileText: ({ size = 16, className, ...props }: IconProps) => (
    <FileText size={size} strokeWidth={1.5} className={className} {...props} />
  ),
};
