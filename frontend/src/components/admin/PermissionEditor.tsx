"use client";

import React from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { useTranslations } from "next-intl";

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
];

const ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
];

interface PermissionEditorProps {
  value: Record<string, unknown>; // usually Record<string, string | string[]>
  onChange: (value: Record<string, unknown>) => void;
}

export function PermissionEditor({ value, onChange }: PermissionEditorProps) {
  const t = useTranslations("Admin.permissions");
  const handleCheck = (resource: string, action: string, checked: boolean) => {
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
          newResValue = ACTIONS.filter((key) => key !== action);
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
          if (newResValue.length === ACTIONS.length) {
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

  const isChecked = (resource: string, action: string) => {
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

  return (
    <div className="overflow-x-auto border border-admin-border rounded-none">
      <table className="w-full text-sm text-left">
        <thead className="bg-admin-surface-muted border-b border-admin-border">
          <tr>
            <th className="px-4 py-3 font-medium text-admin-body">
              {t("system")}
            </th>
            {ACTIONS.map((action) => (
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
          {RESOURCES.map((resource) => (
            <tr key={resource} className="hover:bg-admin-selected/50">
              <td className="px-4 py-3 font-medium text-admin-foreground">
                {t(`resources.${resource}`)}
              </td>

              {ACTIONS.map((action) => (
                <td key={action} className="px-4 py-3 text-center">
                  <Checkbox
                    id={`perm-${resource}-${action}`}
                    checked={isChecked(resource, action)}
                    onChange={(e) =>
                      handleCheck(resource, action, e.target.checked)
                    }
                  />
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
  );
}
