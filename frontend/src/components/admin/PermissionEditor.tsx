"use client";

import React from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { useTranslations } from "next-intl";

const CRUD_ACTIONS = ["read", "create", "update", "delete"] as const;
const COMMUNITY_ACTIONS = ["read", "moderate", "answer_officially", "manage_categories", "restrict_members"] as const;

const RESOURCES = [
  "events",
  "monks",
  "gallery",
  "schedules",
  "donations",
  "members",
  "contacts",
  "settings",
  "users",
  "registrations",
  "website",
  "audit_logs",
  "privacy_requests",
  "account_operations",
  "calendar_resources",
] as const;

const RESOURCE_DEFINITIONS = [
  ...RESOURCES.map((key) => ({ key, actions: CRUD_ACTIONS })),
  { key: "community", actions: COMMUNITY_ACTIONS },
] as const;
type PermissionAction = (typeof CRUD_ACTIONS)[number] | (typeof COMMUNITY_ACTIONS)[number];
const ALL_ACTIONS = Array.from(new Set([...CRUD_ACTIONS, ...COMMUNITY_ACTIONS])) as PermissionAction[];

interface PermissionEditorProps {
  value: Record<string, unknown>; // usually Record<string, string | string[]>
  onChange: (value: Record<string, unknown>) => void;
}

export function PermissionEditor({ value, onChange }: PermissionEditorProps) {
  const t = useTranslations("Admin.permissions");
  const handleCheck = (resource: string, action: PermissionAction | "all", checked: boolean) => {
    const actions = RESOURCE_DEFINITIONS.find((definition) => definition.key === resource)?.actions ?? CRUD_ACTIONS;
    const currentResValue = value[resource];
    let newResValue: string | string[] = [];

    if (action === "all") {
      if (checked) {
        newResValue = "all";
      } else {
        newResValue = []; // clear all
      }
    } else {
      // Processing individual actions
      if (currentResValue === "all") {
        if (checked) {
          newResValue = "all"; // remains all
        } else {
          // It was all, but user unchecked one. We downgrade 'all' to specific array minus the unchecked.
        newResValue = actions.filter((key) => key !== action);
        }
      } else {
        let currentArr: string[] = [];
        if (Array.isArray(currentResValue)) {
          currentArr = currentResValue as string[];
        } else if (typeof currentResValue === "string") {
          currentArr = [currentResValue];
        }

        if (checked) {
          newResValue = [...currentArr, action];
          // If all selected individually, we can convert to 'all'
          if (newResValue.length === actions.length) {
            newResValue = "all";
          }
        } else {
          newResValue = currentArr.filter((a) => a !== action);
        }
      }
    }

    const newValue = { ...value };
    if (Array.isArray(newResValue) && newResValue.length === 0) {
      delete newValue[resource]; // clean up empty
    } else {
      newValue[resource] = newResValue;
    }

    onChange(newValue);
  };

  const isChecked = (resource: string, action: PermissionAction | "all") => {
    const resVal = value[resource];
    if (!resVal) return false;
    if (resVal === "all") return true;

    if (action === "all") return false; // if it's not strictly 'all', the "ALL" checkbox is not fully checked

    if (Array.isArray(resVal)) {
      return resVal.includes(action);
    }
    if (typeof resVal === "string") {
      return resVal === action;
    }
    return false;
  };

  const applyPreset = (preset: "readOnly" | "contentEditor" | "finance" | "fullAdmin" | "clear") => {
    if (preset === "clear") {
      onChange({});
      return;
    }
    if (preset === "fullAdmin") {
      const full: Record<string, unknown> = {};
      RESOURCE_DEFINITIONS.forEach((def) => {
        full[def.key] = "all";
      });
      onChange(full);
      return;
    }
    if (preset === "readOnly") {
      const readOnly: Record<string, unknown> = {};
      RESOURCE_DEFINITIONS.forEach((def) => {
        readOnly[def.key] = ["read"];
      });
      onChange(readOnly);
      return;
    }
    if (preset === "contentEditor") {
      const content: Record<string, unknown> = {
        events: "all",
        monks: "all",
        gallery: "all",
        schedules: "all",
        website: "all",
        calendar_resources: "all",
        community: ["read", "moderate", "answer_officially", "manage_categories"],
      };
      onChange(content);
      return;
    }
    if (preset === "finance") {
      const fin: Record<string, unknown> = {
        donations: "all",
        members: "all",
        registrations: "all",
        contacts: ["read", "update"],
        privacy_requests: ["read", "update"],
      };
      onChange(fin);
      return;
    }
  };

  return (
    <div className="space-y-4">
      {/* Presets Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-admin-surface-muted border border-admin-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
          {t("presets.title")}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset("readOnly")}
            className="px-2.5 py-1 text-xs font-medium border border-admin-border bg-admin-surface hover:bg-admin-selected transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {t("presets.readOnly")}
          </button>
          <button
            type="button"
            onClick={() => applyPreset("contentEditor")}
            className="px-2.5 py-1 text-xs font-medium border border-admin-border bg-admin-surface hover:bg-admin-selected transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {t("presets.contentEditor")}
          </button>
          <button
            type="button"
            onClick={() => applyPreset("finance")}
            className="px-2.5 py-1 text-xs font-medium border border-admin-border bg-admin-surface hover:bg-admin-selected transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {t("presets.finance")}
          </button>
          <button
            type="button"
            onClick={() => applyPreset("fullAdmin")}
            className="px-2.5 py-1 text-xs font-medium border border-admin-action bg-admin-action text-admin-on-action hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {t("presets.fullAdmin")}
          </button>
          <button
            type="button"
            onClick={() => applyPreset("clear")}
            className="px-2.5 py-1 text-xs font-medium border border-admin-danger text-admin-danger hover:bg-admin-danger/10 transition-colors focus-visible:outline-2 focus-visible:outline-admin-focus"
          >
            {t("presets.clear")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-admin-border rounded-none">
        <table className="w-full text-sm text-left">
          <thead className="bg-admin-surface-muted border-b border-admin-border">
            <tr>
              <th className="px-4 py-3 font-medium text-admin-body">
                {t("system")}
              </th>
              {ALL_ACTIONS.map((action) => (
                <th
                  key={action}
                  className="px-4 py-3 font-medium text-admin-body text-center"
                >
                  {t(`actions.${action}`)}
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-admin-body text-center border-l border-admin-border">
                {t("all")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {RESOURCE_DEFINITIONS.map(({ key: resource, actions }) => (
              <tr key={resource} className="hover:bg-admin-selected/50">
                <td className="px-4 py-3 font-medium text-admin-foreground">
                  {t(`resources.${resource}`)}
                </td>

                {ALL_ACTIONS.map((action) => (
                  <td key={action} className="px-4 py-3 text-center">
                    {actions.some((allowed) => allowed === action) ? (
                      <Checkbox
                        id={`perm-${resource}-${action}`}
                        checked={isChecked(resource, action)}
                        onChange={(e) =>
                          handleCheck(resource, action, e.target.checked)
                        }
                      />
                    ) : (
                      <span className="text-admin-muted">—</span>
                    )}
                  </td>
                ))}

                <td className="px-4 py-3 text-center border-l border-admin-border bg-admin-surface-muted/50">
                  <Checkbox
                    id={`perm-${resource}-all`}
                    checked={isChecked(resource, "all")}
                    onChange={(e) =>
                      handleCheck(resource, "all", e.target.checked)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
