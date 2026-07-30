"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils/cn";

interface NavigationItem {
  id: string;
  label: string;
}

interface PageNavigationProps {
  items: NavigationItem[];
}

export default function PageNavigation({ items }: PageNavigationProps) {
  const t = useTranslations("AboutPage");
  const [activeId, setActiveId] = useState(items[0]?.id || "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => Boolean(element));
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <nav className="w-full lg:sticky lg:top-24" aria-label={t("contents")}>
      <div className="-mx-4 overflow-x-auto px-4 pb-3 lg:hidden">
        <div className="flex min-w-max gap-2">
          {items.map((item) => (
            <NavigationButton
              key={item.id}
              item={item}
              active={activeId === item.id}
              onClick={() => scrollToSection(item.id)}
            />
          ))}
        </div>
      </div>

      <div className="hidden border-t border-primary/20 pt-5 lg:block">
        <h2 className="font-heading text-lg font-bold text-text-900">{t("contents")}</h2>
        <ul className="mt-4 space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <NavigationButton
                item={item}
                active={activeId === item.id}
                onClick={() => scrollToSection(item.id)}
                desktop
              />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function NavigationButton({
  item,
  active,
  onClick,
  desktop = false,
}: {
  item: NavigationItem;
  active: boolean;
  onClick: () => void;
  desktop?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "location" : undefined}
      className={cn(
        "min-h-11 rounded-full text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        desktop ? "w-full rounded-none border-l-2 px-4 py-2 text-left" : "px-4 py-2",
        active
          ? desktop
            ? "border-primary bg-primary-50 text-primary-800"
            : "bg-primary text-white"
          : desktop
            ? "border-transparent text-text-700 hover:border-primary/40 hover:text-primary"
            : "border border-primary/20 bg-white text-text-800 hover:border-primary/50",
      )}
    >
      {item.label}
    </button>
  );
}
