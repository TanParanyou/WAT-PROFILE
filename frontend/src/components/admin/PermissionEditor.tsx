"use client";

import React from "react";
import { Checkbox } from "@/components/ui/Checkbox";

const RESOURCES = [
  { key: "events", label: "กิจกรรม (Events)" },
  { key: "monks", label: "พระสงฆ์ (Monks)" },
  { key: "gallery", label: "แกลเลอรี (Gallery)" },
  { key: "schedules", label: "ตารางเวลา (Schedules)" },
  { key: "donations", label: "เงินบริจาค (Donations)" },
  { key: "members", label: "สมาชิก (Members)" },
  { key: "contacts", label: "ผู้ติดต่อ (Contacts)" },
  { key: "settings", label: "ตั้งค่า (Settings)" },
  { key: "users", label: "ผู้ใช้งานและบทบาท (Users/Roles)" },
  { key: "registrations", label: "ลงทะเบียน (Registrations)" },
];

const ACTIONS = [
  { key: "read", label: "ดู (Read)" },
  { key: "create", label: "สร้าง (Create)" },
  { key: "update", label: "แก้ไข (Update)" },
  { key: "delete", label: "ลบ (Delete)" },
];

interface PermissionEditorProps {
  value: Record<string, unknown>; // usually Record<string, string | string[]>
  onChange: (value: Record<string, unknown>) => void;
}

export function PermissionEditor({ value, onChange }: PermissionEditorProps) {
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
          newResValue = ACTIONS.map((a) => a.key).filter((k) => k !== action);
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
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-700">
              ระบบ (Resource)
            </th>
            {ACTIONS.map((a) => (
              <th
                key={a.key}
                className="px-4 py-3 font-medium text-gray-700 text-center"
              >
                {a.label}
              </th>
            ))}
            <th className="px-4 py-3 font-medium text-gray-700 text-center border-l">
              ALL
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {RESOURCES.map((res) => (
            <tr key={res.key} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {res.label}
              </td>

              {ACTIONS.map((a) => (
                <td key={a.key} className="px-4 py-3 text-center">
                  <Checkbox
                    id={`perm-${res.key}-${a.key}`}
                    checked={isChecked(res.key, a.key)}
                    onChange={(e) =>
                      handleCheck(res.key, a.key, e.target.checked)
                    }
                  />
                </td>
              ))}

              <td className="px-4 py-3 text-center border-l bg-gray-50/50">
                <Checkbox
                  id={`perm-${res.key}-all`}
                  checked={isChecked(res.key, "all")}
                  onChange={(e) =>
                    handleCheck(res.key, "all", e.target.checked)
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
