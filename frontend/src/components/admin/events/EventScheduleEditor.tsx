"use client";

import React from "react";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Plus, Trash2, Clock, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MultiLangInput } from "@/components/admin/MultiLangInput";
import { SortableList } from "@/components/admin/SortableList";
import type { MultiLangText, MultiLangError } from "@/types/api";
import { useTranslations } from "next-intl";

interface ScheduleItemError {
  start_time?: { message?: string };
  end_time?: { message?: string };
  activity?: MultiLangError;
}

export function EventScheduleEditor() {
  const t = useTranslations("Admin");
  const { control, register, formState: { errors } } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "schedule",
  });

  const handleAdd = () => {
    append({
      start_time: "",
      end_time: "",
      activity: { th: "", en: "", de: "" },
    });
  };

  const scheduleErrors = errors.schedule as Record<number, ScheduleItemError> | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={16} className="text-amber-600" />
            {t("events.schedule.title")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("events.schedule.description")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          icon={<Plus size={14} />}
        >
          {t("events.schedule.add")}
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <p className="text-sm text-gray-400">{t("events.schedule.empty")}</p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleAdd}
            className="mt-2 text-amber-600 hover:text-amber-700"
          >
            {t("events.schedule.createFirst")}
          </Button>
        </div>
      ) : (
        <SortableList
          items={fields}
          onReorder={move}
          className="space-y-4"
          renderItem={(field, index, dragProps, isDragging) => {
            const itemErrors = scheduleErrors?.[index];

            return (
              <div
                key={field.id}
                {...dragProps}
                className={`p-4 border rounded-xl bg-white shadow-sm space-y-4 relative group transition-all ${
                  isDragging
                    ? "border-amber-400 bg-amber-50/30 opacity-50 scale-[0.99]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors">
                      <GripVertical size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {t("events.schedule.itemOrder", { index: index + 1 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                      title={t("events.schedule.moveUp")}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={index === fields.length - 1}
                      onClick={() => move(index, index + 1)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                      title={t("events.schedule.moveDown")}
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={t("events.schedule.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Grid layout for Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Time field */}
                  <div className="col-span-1">
                    <Input
                      id={`schedule.${index}.start_time`}
                      label={t("events.schedule.startTimeLabel")}
                      type="time"
                      {...register(`schedule.${index}.start_time`)}
                      error={itemErrors?.start_time?.message}
                      required={true}
                    />
                  </div>
                  {/* End Time field */}
                  <div className="col-span-1">
                    <Input
                      id={`schedule.${index}.end_time`}
                      label={t("events.schedule.endTimeLabel")}
                      type="time"
                      {...register(`schedule.${index}.end_time`)}
                      error={itemErrors?.end_time?.message}
                      required={true}
                    />
                  </div>
                </div>

                {/* Activity (Multi-lang) field */}
                <Controller
                  control={control}
                  name={`schedule.${index}.activity`}
                  render={({ field: controllerField }) => (
                    <MultiLangInput
                      label={t("events.schedule.activityLabel")}
                      value={(controllerField.value || { th: "", en: "", de: "" }) as MultiLangText}
                      onChange={controllerField.onChange}
                      error={
                        itemErrors?.activity?.th?.message ||
                        itemErrors?.activity?.en?.message ||
                        itemErrors?.activity?.de?.message ||
                        itemErrors?.activity?.message
                      }
                    />
                  )}
                />
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
