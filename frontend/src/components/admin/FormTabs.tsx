"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

export interface TabConfig<T extends string> {
  id: T;
  label: string;
  icon: React.ReactNode;
  hasError?: boolean;
}

interface FormTabsProps<T extends string> {
  tabs: TabConfig<T>[];
  activeTab: T;
  setActiveTab: (tab: T) => void;
}

export function FormTabs<T extends string>({
  tabs,
  activeTab,
  setActiveTab,
}: FormTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-admin-border pb-3">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          type="button"
          size="sm"
          variant={activeTab === tab.id ? "primary" : "outline"}
          icon={tab.icon}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="flex items-center gap-1.5">
            {tab.label}
            {tab.hasError && (
              <span className="w-2 h-2 rounded-full bg-admin-danger animate-pulse" />
            )}
          </span>
        </Button>
      ))}
    </div>
  );
}

export default FormTabs;
