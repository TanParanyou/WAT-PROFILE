import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Chanting } from "@/types/chanting";

function formatDurationSeconds(sec: number): string {
  if (isNaN(sec) || sec < 0) return "0:00";
  const mins = Math.floor(sec / 60);
  const remSec = Math.floor(sec % 60);
  return `${mins}:${remSec < 10 ? "0" : ""}${remSec}`;
}

function filterChantings(
  chantings: readonly Chanting[],
  category: string,
  search: string,
): Chanting[] {
  return chantings.filter((item) => {
    if (category !== "all" && item.category !== category) {
      return false;
    }
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      const titleTh = (item.title?.th || "").toLowerCase();
      const titleEn = (item.title?.en || "").toLowerCase();
      const paliThai = (item.pali_thai || "").toLowerCase();
      const paliRoman = (item.pali_roman || "").toLowerCase();
      return (
        titleTh.includes(q) ||
        titleEn.includes(q) ||
        paliThai.includes(q) ||
        paliRoman.includes(q)
      );
    }
    return true;
  });
}

const mockChants: Chanting[] = [
  {
    id: 1,
    slug: "namo-tassa",
    title: { th: "นะโม ตัสสะ", en: "Namo Tassa", de: "Namo Tassa" },
    category: "general",
    pali_thai: "นะโม ตัสสะ ภะคะวะโต",
    pali_roman: "Namo tassa bhagavato",
    translation: { th: "ขอนอบน้อม...", en: "Homage...", de: "Ehre..." },
    duration_seconds: 45,
    display_order: 1,
    is_active: true,
  },
  {
    id: 2,
    slug: "buddhabhithuti",
    title: { th: "พุทธาภิถุติ", en: "Praise of Buddha", de: "Lobpreisung" },
    category: "morning_chant",
    pali_thai: "โย โส ตะถาคะโต",
    pali_roman: "Yo so tathagato",
    translation: { th: "พระตถาคต...", en: "The Tathagata...", de: "Jener Tathagata..." },
    duration_seconds: 125,
    display_order: 2,
    is_active: true,
  },
];

describe("Chanting feature utils", () => {
  it("formats duration seconds to mm:ss format", () => {
    assert.equal(formatDurationSeconds(45), "0:45");
    assert.equal(formatDurationSeconds(125), "2:05");
    assert.equal(formatDurationSeconds(0), "0:00");
    assert.equal(formatDurationSeconds(-5), "0:00");
  });

  it("filters chantings by category correctly", () => {
    const all = filterChantings(mockChants, "all", "");
    assert.equal(all.length, 2);

    const morning = filterChantings(mockChants, "morning_chant", "");
    assert.equal(morning.length, 1);
    assert.equal(morning[0].slug, "buddhabhithuti");

    const paritta = filterChantings(mockChants, "paritta", "");
    assert.equal(paritta.length, 0);
  });

  it("searches chantings by Thai and Roman Pali keywords", () => {
    const thaiSearch = filterChantings(mockChants, "all", "ภะคะวะโต");
    assert.equal(thaiSearch.length, 1);
    assert.equal(thaiSearch[0].slug, "namo-tassa");

    const romanSearch = filterChantings(mockChants, "all", "tathagato");
    assert.equal(romanSearch.length, 1);
    assert.equal(romanSearch[0].slug, "buddhabhithuti");
  });
});
