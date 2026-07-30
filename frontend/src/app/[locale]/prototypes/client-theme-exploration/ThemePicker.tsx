"use client";

import type { ThemeVariantKey } from "./prototype-data";
import { THEME_VARIANTS } from "./prototype-data";
import styles from "./prototype-shell.module.css";

type ThemePickerProps = {
  active: ThemeVariantKey;
  onChange: (key: ThemeVariantKey) => void;
};

export default function ThemePicker({ active, onChange }: ThemePickerProps) {
  return (
    <div
      className={styles.picker}
      role="radiogroup"
      aria-label="เลือกแนวทางดีไซน์"
    >
      <span className={styles.pickerLabel}>Theme</span>
      {THEME_VARIANTS.map((variant, index) => (
        <button
          key={variant.key}
          type="button"
          role="radio"
          aria-checked={active === variant.key}
          className={styles.pickerButton}
          data-active={active === variant.key}
          onClick={() => onChange(variant.key)}
        >
          <span aria-hidden="true">{index + 1}</span>
          <span>{variant.name}</span>
        </button>
      ))}
    </div>
  );
}
