"use client";

import { useTranslations } from "next-intl";

export interface SelectOption {
  value: string;
  label: string;
}

export function useAppOptions() {
  const t = useTranslations("Admin");

  // Event type options
  const getEventTypeOptions = (): SelectOption[] => [
    { value: "ceremony", label: t("events.types.ceremony") },
    { value: "meditation_course", label: t("events.types.meditation_course") },
    { value: "festival", label: t("events.types.festival") },
    { value: "other", label: t("events.types.other") },
  ];

  // Monk position options
  const getMonkPositionOptions = (): SelectOption[] => [
    { value: "abbot", label: t("monks.positions.abbot") },
    { value: "vice_abbot", label: t("monks.positions.vice_abbot") },
    { value: "assistant_abbot", label: t("monks.positions.assistant_abbot") },
    { value: "secretary", label: t("monks.positions.secretary") },
    { value: "dhammaduta", label: t("monks.positions.dhammaduta") },
    { value: "meditation_master", label: t("monks.positions.meditation_master") },
    { value: "resident_monk", label: t("monks.positions.resident_monk") },
    { value: "advisor", label: t("monks.positions.advisor") },
    { value: "monk", label: t("monks.positions.monk") },
    { value: "novice", label: t("monks.positions.novice") },
  ];

  // Schedule type options
  const getScheduleTypeOptions = (includeSelect = false): SelectOption[] => {
    const options = [
      { value: "daily", label: t("schedules.daily") },
      { value: "weekly", label: t("schedules.weekly") },
      { value: "special", label: t("schedules.special") },
    ];
    if (includeSelect) {
      return [{ value: "", label: t("schedules.selectType") }, ...options];
    }
    return options;
  };

  // Day of week options (0 = Sunday, 1 = Monday, ...)
  const getDayOfWeekOptions = (includeSelect = false): SelectOption[] => {
    const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
    const options = dayKeys.map((key, i) => ({
      value: String(i),
      label: t(`schedules.days.${key}`),
    }));

    if (includeSelect) {
      return [{ value: "", label: t("schedules.selectDay") }, ...options];
    }
    return options;
  };

  // Helper functions to get label by value
  const getEventTypeLabel = (value: string): string => {
    const option = getEventTypeOptions().find((o) => o.value === value);
    return option ? option.label : value;
  };

  const getMonkPositionLabel = (value: string): string => {
    const option = getMonkPositionOptions().find((o) => o.value === value);
    return option ? option.label : value;
  };

  const getScheduleTypeLabel = (value: string): string => {
    const option = getScheduleTypeOptions().find((o) => o.value === value);
    return option ? option.label : value;
  };

  const getDayOfWeekLabel = (value: number | string | null): string => {
    if (value === null || value === undefined || value === "") return "-";
    const option = getDayOfWeekOptions().find((o) => o.value === String(value));
    return option ? option.label : "-";
  };

  return {
    getEventTypeOptions,
    getMonkPositionOptions,
    getScheduleTypeOptions,
    getDayOfWeekOptions,
    getEventTypeLabel,
    getMonkPositionLabel,
    getScheduleTypeLabel,
    getDayOfWeekLabel,
  };
}
