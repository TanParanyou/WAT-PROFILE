"use client";

import React from "react";
import { ImageInputPreview } from "@/components/admin/ImageInputPreview";

export interface UrlImageInputWithPreviewProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  error?: string;
  description?: string;
}

export function UrlImageInputWithPreview({
  label,
  value = "",
  onChange,
  placeholder = "https://...",
  error,
  description,
}: UrlImageInputWithPreviewProps) {
  return (
    <ImageInputPreview
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      description={description}
      variant="standard"
    />
  );
}

