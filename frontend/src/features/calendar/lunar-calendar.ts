import { format, startOfDay, addDays, isAfter } from "date-fns";
import type { CalendarEntry, CalendarLocale } from "./types";

export type HolyDayType = "full_moon" | "new_moon" | "quarter_waxing" | "quarter_waning" | "major_holiday";

export interface HolyDayInfo {
  date: string; // YYYY-MM-DD
  type: HolyDayType;
  title: Record<CalendarLocale, string>;
  description: Record<CalendarLocale, string>;
}

// Fixed Thai Sangha Buddhist Holidays (2024 - 2030) based on Royal Thai / Sangha Supreme Council Calendar
const MAJOR_BUDDHIST_HOLIDAYS: readonly HolyDayInfo[] = [
  // 2025
  {
    date: "2025-02-12",
    type: "major_holiday",
    title: {
      th: "วันมาฆบูชา (ขึ้น 15 ค่ำ เดือน 3)",
      en: "Makha Bucha Day (Full Moon)",
      de: "Makha-Bucha-Tag (Vollmond)",
    },
    description: {
      th: "วันเพ็ญเดือน 3 วันคล้ายวันที่พระสัมมาสัมพุทธเจ้าทรงแสดงโอวาทปาติโมกข์แก่พระอรหันต์ 1,250 องค์ที่มาประชุมกันโดยมิได้นัดหมาย",
      en: "Commemorates the spontaneous gathering of 1,250 enlightened disciples to whom the Buddha gave the Ovada Patimokkha.",
      de: "Gedenktag an die spontane Versammlung von 1.250 erleuchteten Jüngern, denen der Buddha die Ovada-Patimokkha-Lehre verkündete.",
    },
  },
  {
    date: "2025-05-11",
    type: "major_holiday",
    title: {
      th: "วันวิสาขบูชา (ขึ้น 15 ค่ำ เดือน 6)",
      en: "Visakha Bucha Day (Vesak Day)",
      de: "Visakha-Bucha-Tag (Vesak)",
    },
    description: {
      th: "วันสำคัญสากลของโลก วันคล้ายวันประสูติ ตรัสรู้ และปรินิพพานของพระสัมมาสัมพุทธเจ้า",
      en: "The holiest day in Buddhism, commemorating the Birth, Enlightenment, and Parinirvana of Gautama Buddha.",
      de: "Der heiligste Tag im Buddhismus, der die Geburt, die Erleuchtung und das Parinirvana von Gautama Buddha feiert.",
    },
  },
  {
    date: "2025-05-19",
    type: "major_holiday",
    title: {
      th: "วันอัฏฐมีบูชา (แรม 8 ค่ำ เดือน 6)",
      en: "Atthami Bucha Day",
      de: "Atthami-Bucha-Tag",
    },
    description: {
      th: "วันคล้ายวันถวายพระเพลิงพระพุทธสรีระของพระสัมมาสัมพุทธเจ้า",
      en: "Commemoration of the cremation of the Buddha's body eight days after his Parinirvana.",
      de: "Gedenktag an die Einäscherung des Körpers des Buddha acht Tage nach seinem Parinirvana.",
    },
  },
  {
    date: "2025-07-10",
    type: "major_holiday",
    title: {
      th: "วันอาสาฬหบูชา (ขึ้น 15 ค่ำ เดือน 8)",
      en: "Asalha Bucha Day (Dhamma Day)",
      de: "Asalha-Bucha-Tag (Dharma-Tag)",
    },
    description: {
      th: "วันคล้ายวันที่พระพุทธเจ้าทรงแสดงปฐมเทศนา ธัมมจักกัปปวัตตนสูตร และเป็นวันที่พระรัตนตรัยครบองค์สาม",
      en: "Commemorates the Buddha's first sermon (Dhammacakkappavattana Sutta) and the founding of the Sangha.",
      de: "Erinnert an die erste Lehrrede des Buddha (Dhammacakkappavattana Sutta) und die Entstehung der Sangha.",
    },
  },
  {
    date: "2025-07-11",
    type: "major_holiday",
    title: {
      th: "วันเข้าพรรษา (แรม 1 ค่ำ เดือน 8)",
      en: "Khao Phansa (Start of Buddhist Lent)",
      de: "Khao Phansa (Beginn der Regenzeitklausur)",
    },
    description: {
      th: "วันเริ่มต้นที่พระสงฆ์จำพรรษาอยู่ ณ วัดใดวัดหนึ่งตลอด 3 เดือนในช่วงฤดูฝน",
      en: "The beginning of the three-month annual rains retreat (Vassa) for Buddhist monastics.",
      de: "Der Beginn der dreimonatigen Klausurzeit (Vassa) der buddhistischen Mönche während der Regenzeit.",
    },
  },
  {
    date: "2025-10-07",
    type: "major_holiday",
    title: {
      th: "วันออกพรรษา (ขึ้น 15 ค่ำ เดือน 11)",
      en: "Ok Phansa (End of Buddhist Lent)",
      de: "Ok Phansa (Ende der Regenzeitklausur)",
    },
    description: {
      th: "วันสิ้นสุดการจำพรรษา 3 เดือนของพระภิกษุสงฆ์ และวันมหาปวารณา",
      en: "The conclusion of the three-month monastic rains retreat (Vassa), marked by the Pavarana ceremony.",
      de: "Abschluss der dreimonatigen Regenzeitklausur mit der Pavarana-Zeremonie.",
    },
  },

  // 2026
  {
    date: "2026-03-03",
    type: "major_holiday",
    title: {
      th: "วันมาฆบูชา (ขึ้น 15 ค่ำ เดือน 4)",
      en: "Makha Bucha Day (Full Moon)",
      de: "Makha-Bucha-Tag (Vollmond)",
    },
    description: {
      th: "วันเพ็ญมาฆปุรณมี วันคล้ายวันที่พระสัมมาสัมพุทธเจ้าทรงแสดงโอวาทปาติโมกข์",
      en: "Commemorates the spontaneous gathering of 1,250 enlightened disciples and the Ovada Patimokkha.",
      de: "Gedenktag an die spontane Versammlung von 1.250 Jüngern und die Ovada-Patimokkha-Lehre.",
    },
  },
  {
    date: "2026-05-31",
    type: "major_holiday",
    title: {
      th: "วันวิสาขบูชา (ขึ้น 15 ค่ำ เดือน 7)",
      en: "Visakha Bucha Day (Vesak Day)",
      de: "Visakha-Bucha-Tag (Vesak)",
    },
    description: {
      th: "วันสำคัญสากลของโลก วันคล้ายวันประสูติ ตรัสรู้ และปรินิพพานของพระพุทธเจ้า",
      en: "The holiest day in Buddhism, commemorating the Birth, Enlightenment, and Parinirvana of Gautama Buddha.",
      de: "Der heiligste Tag im Buddhismus, der die Geburt, Erleuchtung und das Parinirvana Buddhas feiert.",
    },
  },
  {
    date: "2026-06-08",
    type: "major_holiday",
    title: {
      th: "วันอัฏฐมีบูชา (แรม 8 ค่ำ เดือน 7)",
      en: "Atthami Bucha Day",
      de: "Atthami-Bucha-Tag",
    },
    description: {
      th: "วันถวายพระเพลิงพระพุทธสรีระ ณ เมืองกุสินารา",
      en: "Commemoration of the cremation of the Buddha's body.",
      de: "Gedenktag an die Einäscherung des Körpers des Buddha.",
    },
  },
  {
    date: "2026-07-29",
    type: "major_holiday",
    title: {
      th: "วันอาสาฬหบูชา (ขึ้น 15 ค่ำ เดือน 8-8)",
      en: "Asalha Bucha Day (Dhamma Day)",
      de: "Asalha-Bucha-Tag (Dharma-Tag)",
    },
    description: {
      th: "วันคล้ายวันที่พระพุทธองค์ทรงแสดงปฐมเทศนา และเกิดพระสงฆ์องค์แรกในโลก",
      en: "Commemorates the Buddha's first sermon and the founding of the Sangha.",
      de: "Erinnert an die erste Lehrrede des Buddha und die Entstehung der Sangha.",
    },
  },
  {
    date: "2026-07-30",
    type: "major_holiday",
    title: {
      th: "วันเข้าพรรษา (แรม 1 ค่ำ เดือน 8-8)",
      en: "Khao Phansa (Start of Buddhist Lent)",
      de: "Khao Phansa (Beginn der Regenzeitklausur)",
    },
    description: {
      th: "วันเริ่มต้นการอยู่จำพรรษาตลอดไตรมาส 3 เดือน",
      en: "The beginning of the monastic rains retreat.",
      de: "Der Beginn der dreimonatigen Regenzeitklausur.",
    },
  },
  {
    date: "2026-10-25",
    type: "major_holiday",
    title: {
      th: "วันออกพรรษา (ขึ้น 15 ค่ำ เดือน 11)",
      en: "Ok Phansa (End of Buddhist Lent)",
      de: "Ok Phansa (Ende der Regenzeitklausur)",
    },
    description: {
      th: "วันสิ้นสุดระยะเวลาจำพรรษาของพระภิกษุสงฆ์",
      en: "The conclusion of the monastic rains retreat.",
      de: "Abschluss der dreimonatigen Regenzeitklausur.",
    },
  },

  // 2027
  {
    date: "2027-02-21",
    type: "major_holiday",
    title: {
      th: "วันมาฆบูชา (ขึ้น 15 ค่ำ เดือน 3)",
      en: "Makha Bucha Day (Full Moon)",
      de: "Makha-Bucha-Tag (Vollmond)",
    },
    description: {
      th: "วันเพ็ญเดือน 3 วันแห่งโอวาทปาติโมกข์",
      en: "Makha Bucha Day celebrating the Ovada Patimokkha.",
      de: "Makha-Bucha-Tag zur Feier der Ovada Patimokkha.",
    },
  },
  {
    date: "2027-05-20",
    type: "major_holiday",
    title: {
      th: "วันวิสาขบูชา (ขึ้น 15 ค่ำ เดือน 6)",
      en: "Visakha Bucha Day (Vesak Day)",
      de: "Visakha-Bucha-Tag (Vesak)",
    },
    description: {
      th: "วันประสูติ ตรัสรู้ และปรินิพพานของพระสัมมาสัมพุทธเจ้า",
      en: "Commemoration of the Buddha's Birth, Enlightenment, and Parinirvana.",
      de: "Feier der Geburt, Erleuchtung und des Parinirvana Buddhas.",
    },
  },
  {
    date: "2027-07-18",
    type: "major_holiday",
    title: {
      th: "วันอาสาฬหบูชา (ขึ้น 15 ค่ำ เดือน 8)",
      en: "Asalha Bucha Day (Dhamma Day)",
      de: "Asalha-Bucha-Tag (Dharma-Tag)",
    },
    description: {
      th: "วันแสดงปฐมเทศนาและวันกำเนิดพระสงฆ์",
      en: "Commemoration of the Buddha's first discourse.",
      de: "Gedenken an die erste Lehrrede des Buddha.",
    },
  },
  {
    date: "2027-07-19",
    type: "major_holiday",
    title: {
      th: "วันเข้าพรรษา (แรม 1 ค่ำ เดือน 8)",
      en: "Khao Phansa (Start of Buddhist Lent)",
      de: "Khao Phansa (Beginn der Regenzeitklausur)",
    },
    description: {
      th: "วันเริ่มต้นการจำพรรษา 3 เดือน",
      en: "Start of the rains retreat.",
      de: "Beginn der Regenzeitklausur.",
    },
  },
  {
    date: "2027-10-14",
    type: "major_holiday",
    title: {
      th: "วันออกพรรษา (ขึ้น 15 ค่ำ เดือน 11)",
      en: "Ok Phansa (End of Buddhist Lent)",
      de: "Ok Phansa (Ende der Regenzeitklausur)",
    },
    description: {
      th: "วันออกพรรษาและวันมหาปวารณา",
      en: "End of the monastic rains retreat.",
      de: "Ende der Regenzeitklausur.",
    },
  },
];

/**
 * Astronomical Lunar Phase Calculation for Uposatha Days (วันพระ).
 * Average Synodic Month = 29.530588853 days.
 * Known Reference New Moon: 2000-01-06 18:14 UTC (JD 2451550.26)
 */
const SYNODIC_MONTH = 29.530588853;
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

export function getMoonPhaseDay(date: Date): {
  phaseAge: number;
  isUposatha: boolean;
  type?: HolyDayType;
  lunarLabel: Record<CalendarLocale, string>;
} {
  const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const diffMs = utcDate - REFERENCE_NEW_MOON_MS;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const phaseAge = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;

  // Window tolerances for calendar day alignment (<= 0.5 day window ensures exactly 1 day per phase)
  // First Quarter (ขึ้น 8 ค่ำ): ~7.38 days
  const isWaxing8 = Math.abs(phaseAge - 7.3826) <= 0.5;
  // Full Moon (ขึ้น 15 ค่ำ): ~14.76 days
  const isWaxing15 = Math.abs(phaseAge - 14.7653) <= 0.5;
  // Last Quarter (แรม 8 ค่ำ): ~22.14 days
  const isWaning8 = Math.abs(phaseAge - 22.1479) <= 0.5;
  // New Moon (แรม 14/15 ค่ำ): ~0 or ~29.53 days
  const isWaningEnd = phaseAge <= 0.5 || phaseAge >= SYNODIC_MONTH - 0.5;

  if (isWaxing15) {
    return {
      phaseAge,
      isUposatha: true,
      type: "full_moon",
      lunarLabel: {
        th: "วันพระ (ขึ้น ๑๕ ค่ำ — วันเพ็ญ)",
        en: "Uposatha Day (Full Moon — 15th Waxing)",
        de: "Uposatha-Tag (Vollmond — 15. Tag)",
      },
    };
  }

  if (isWaxing8) {
    return {
      phaseAge,
      isUposatha: true,
      type: "quarter_waxing",
      lunarLabel: {
        th: "วันพระ (ขึ้น ๘ ค่ำ)",
        en: "Uposatha Day (First Quarter — 8th Waxing)",
        de: "Uposatha-Tag (Zunehmender Halbmond — 8. Tag)",
      },
    };
  }

  if (isWaning8) {
    return {
      phaseAge,
      isUposatha: true,
      type: "quarter_waning",
      lunarLabel: {
        th: "วันพระ (แรม ๘ ค่ำ)",
        en: "Uposatha Day (Last Quarter — 8th Waning)",
        de: "Uposatha-Tag (Abnehmender Halbmond — 8. Tag)",
      },
    };
  }

  if (isWaningEnd) {
    return {
      phaseAge,
      isUposatha: true,
      type: "new_moon",
      lunarLabel: {
        th: "วันพระ (แรม ๑๔/๑๕ ค่ำ — วันดับ)",
        en: "Uposatha Day (New Moon — 14th/15th Waning)",
        de: "Uposatha-Tag (Neumond — 14./15. Tag)",
      },
    };
  }

  return {
    phaseAge,
    isUposatha: false,
    lunarLabel: {
      th: "",
      en: "",
      de: "",
    },
  };
}

/**
 * Returns all Buddhist holy days and major religious observances in the specified date range.
 */
export function getBuddhistHolyDaysForRange(
  startDate: Date,
  endDate: Date,
  locale: CalendarLocale = "th",
): CalendarEntry[] {
  const result: CalendarEntry[] = [];
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  const majorMap = new Map<string, HolyDayInfo>();
  for (const holiday of MAJOR_BUDDHIST_HOLIDAYS) {
    majorMap.set(holiday.date, holiday);
  }

  let curr = start;
  while (!isAfter(curr, end)) {
    const dateStr = format(curr, "yyyy-MM-dd");

    const nextDateStr = format(addDays(curr, 1), "yyyy-MM-dd");

    // Check if there is an official major holiday on this date
    const majorHoliday = majorMap.get(dateStr);
    if (majorHoliday) {
      result.push({
        id: `holy-day-${dateStr}`,
        source: "holy_day",
        title: majorHoliday.title[locale] || majorHoliday.title.th,
        start: dateStr,
        end: nextDateStr,
        allDay: true,
        status: "active",
        display: {
          tone: "default",
        },
        detail: {
          canEdit: false,
          description: majorHoliday.description[locale] || majorHoliday.description.th,
          location: undefined,
        },
      });
    } else {
      // Check for regular Uposatha days (8/15 ค่ำ)
      const prevDateStr = format(addDays(curr, -1), "yyyy-MM-dd");
      const nextDayStr = format(addDays(curr, 1), "yyyy-MM-dd");
      const nearMajor = majorMap.has(prevDateStr) || majorMap.has(nextDayStr);

      const moon = getMoonPhaseDay(curr);
      if (moon.isUposatha && (!nearMajor || moon.type !== "full_moon")) {
        result.push({
          id: `uposatha-${dateStr}`,
          source: "holy_day",
          title: moon.lunarLabel[locale] || moon.lunarLabel.th,
          start: dateStr,
          end: nextDateStr,
          allDay: true,
          status: "active",
          display: {
            tone: "muted",
          },
          detail: {
            canEdit: false,
            description:
              locale === "th"
                ? "วันอุโบสถ / วันธรรมสวนะ สำหรับการรักษาศีล สวดมนต์ และเจริญจิตภาวนา"
                : locale === "de"
                ? "Uposatha-Beobachtungstag für Meditation, Achtsamkeit und das Einhalten der Tugendregeln."
                : "Uposatha observance day for meditation, mindfulness, and keeping Buddhist precepts.",
            location: undefined,
          },
        });
      }
    }

    curr = addDays(curr, 1);
  }

  return result;
}
