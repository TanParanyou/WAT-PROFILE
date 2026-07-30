"use client";

import { useEffect, useState } from "react";
import ThemePicker from "./ThemePicker";
import { PROTOTYPE_CONTENT, type ThemeVariantKey } from "./prototype-data";
import styles from "./prototype-shell.module.css";
import ContemporaryPractice from "./variants/ContemporaryPractice";
import ForestThreshold from "./variants/ForestThreshold";
import LivingCommunity from "./variants/LivingCommunity";
import OneBreathMinimal from "./variants/OneBreathMinimal";

const variantKeys: readonly ThemeVariantKey[] = [
  "forest",
  "community",
  "practice",
  "minimal",
];

export default function ThemeExploration() {
  const [active, setActive] = useState<ThemeVariantKey>("forest");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!variantKeys.length || !["ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }

      const current = variantKeys.indexOf(active);
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = (current + delta + variantKeys.length) % variantKeys.length;
      setActive(variantKeys[next]);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  const renderVariant = () => {
    switch (active) {
      case "forest":
        return <ForestThreshold content={PROTOTYPE_CONTENT} />;
      case "community":
        return <LivingCommunity content={PROTOTYPE_CONTENT} />;
      case "practice":
        return <ContemporaryPractice content={PROTOTYPE_CONTENT} />;
      case "minimal":
        return <OneBreathMinimal content={PROTOTYPE_CONTENT} />;
    }
  };

  return (
    <main className={styles.canvas} data-theme-variant={active}>
      <ThemePicker active={active} onChange={setActive} />
      <div className={styles.stage} aria-live="polite">{renderVariant()}</div>
    </main>
  );
}
