"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedText } from "@/utils/localizedText";
import type { GalleryCategory, Event } from "@/types/entities";

interface BulkCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  categories: GalleryCategory[];
  onConfirm: (categoryId: number | null) => Promise<void>;
}

export function BulkCategoryModal({
  isOpen,
  onClose,
  selectedCount,
  categories,
  onConfirm,
}: BulkCategoryModalProps) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const catId = selectedCategory === "" ? null : parseInt(selectedCategory, 10);
      await onConfirm(catId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = [
    { value: "", label: t("gallery.clearCategory") },
    ...categories.map((c) => ({
      value: String(c.id),
      label: getLocalizedText(c.name, locale) || c.slug,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("gallery.bulkCategoryTitle")}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-admin-muted">
          {t("gallery.bulkCategoryDesc", { count: selectedCount })}
        </p>

        <Select
          id="bulk-category-select"
          label={t("gallery.newCategory")}
          options={options}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        />

        <div className="pt-4 border-t border-admin-border flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t("gallery.updateCount", { count: selectedCount })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface BulkEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  events: Event[];
  onConfirm: (eventId: number | null) => Promise<void>;
}

export function BulkEventModal({
  isOpen,
  onClose,
  selectedCount,
  events,
  onConfirm,
}: BulkEventModalProps) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const evId = selectedEvent === "" ? null : parseInt(selectedEvent, 10);
      await onConfirm(evId);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = [
    { value: "", label: t("gallery.clearEvent") },
    ...events.map((e) => ({
      value: String(e.id),
      label: getLocalizedText(e.title, locale) || `กิจกรรม #${e.id}`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("gallery.bulkEventTitle")}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-admin-muted">
          {t("gallery.bulkEventDesc", { count: selectedCount })}
        </p>

        <Select
          id="bulk-event-select"
          label={t("gallery.newEvent")}
          options={options}
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        />

        <div className="pt-4 border-t border-admin-border flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {t("gallery.updateCount", { count: selectedCount })}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
