export type ThemeVariantKey = "forest" | "community" | "practice" | "minimal";

export type ThemeVariant = {
  key: ThemeVariantKey;
  name: string;
  axis: string;
};

export type PrototypeEvent = {
  dateLabel: string;
  title: string;
  summary: string;
  image: string;
};

export type PrototypeContent = {
  templeName: string;
  location: string;
  message: string;
  introduction: string;
  primaryCta: string;
  secondaryCta: string;
  heroImage: string;
  storyImage: string;
  visitImage: string;
  events: readonly PrototypeEvent[];
};

export const THEME_VARIANTS = [
  { key: "forest", name: "ร่มไม้ก่อนเข้าศาลา", axis: "Immersive" },
  { key: "community", name: "วัดที่มีชีวิต", axis: "Community" },
  { key: "practice", name: "สำนักปฏิบัติร่วมสมัย", axis: "Architectural" },
  { key: "minimal", name: "หนึ่งภาพ หนึ่งลมหายใจ", axis: "Minimal" },
] as const satisfies readonly ThemeVariant[];

export const PROTOTYPE_CONTENT: PrototypeContent = {
  templeName: "วัดหลวงพ่อใส",
  location: "Großkrotzenburg · Germany",
  message: "พื้นที่แห่งการปฏิบัติ เพื่อความสงบและความสุขที่แท้จริง",
  introduction:
    "พื้นที่เปิดสำหรับทุกคนที่อยากเรียนรู้การเจริญสติ ทำความรู้จักพระพุทธศาสนาเถรวาทสายวัดป่า และค่อย ๆ เริ่มต้นการปฏิบัติในจังหวะของตนเอง",
  primaryCta: "ดูกิจกรรมและเข้าร่วมปฏิบัติธรรม",
  secondaryCta: "วางแผนการเดินทางมาวัด",
  heroImage: "/images/gallery/common/LINE_ALBUM_1262026_260208_17.jpg",
  storyImage: "/images/gallery/common/LINE_ALBUM_1262026_260208_1.jpg",
  visitImage:
    "/images/gallery/before_buying_2018/LINE_ALBUM_ภาพที่หลวงปู่ทิวาไปดูก่อนซื้อปี 2018_260208_1.jpg",
  events: [
    {
      dateLabel: "เสาร์ 8 สิงหาคม · 09:30",
      title: "วันภาวนาและเจริญสติ",
      summary:
        "เริ่มต้นด้วยการทำวัตร นั่งสมาธิ และสนทนาธรรม เหมาะสำหรับทั้งผู้เริ่มต้นและผู้ที่ปฏิบัติเป็นประจำ",
      image: "/images/gallery/common/LINE_ALBUM_1262026_260208_6.jpg",
    },
    {
      dateLabel: "อาทิตย์ 16 สิงหาคม · 10:00",
      title: "ทำบุญและถวายภัตตาหาร",
      summary:
        "ร่วมทำบุญ ฟังธรรม และพบปะชุมชนไทย–เยอรมัน กรุณามาถึงก่อนเริ่มกิจกรรม 20 นาที",
      image: "/images/gallery/common/LINE_ALBUM_1262026_260208_12.jpg",
    },
    {
      dateLabel: "เสาร์ 29 สิงหาคม · 18:00",
      title: "สวดมนต์เย็นและนั่งสมาธิ",
      summary:
        "ช่วงเย็นที่เรียบง่ายสำหรับพักจากความเร่งรีบ มีคำแนะนำเบื้องต้นเป็นภาษาไทยและเยอรมัน",
      image: "/images/gallery/common/LINE_ALBUM_1262026_260208_20.jpg",
    },
  ],
};
