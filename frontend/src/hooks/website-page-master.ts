import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { websiteCmsAdminService } from "@/services/websiteCmsService";
import type { ContentPage } from "@/types/website-cms";
import { normalizeLegacyRichText } from "@/lib/rich-text/document";
import type { 
  HomePageMasterFormData, 
  ContactPageMasterFormData, 
  AboutPageMasterFormData 
} from "@/schemas/website-page.schema";

const LOCAL_STORAGE_KEY = "mock_home_page_master_data";
const CONTACT_LOCAL_STORAGE_KEY = "mock_contact_page_master_data";

function localizedRichTextFromStrings(value: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(value).map(([locale, content]) => [locale, normalizeLegacyRichText(content)]),
  );
}

const defaultMockData: HomePageMasterFormData = {
  id: "home-page-id",
  slug: "home",
  status: "published",
  seo: {
    title: {
      th: "วัดโปรไฟล์ - หน้าแรก",
      en: "Wat Profile - Home",
      de: "Wat Profile - Startseite",
    },
    description: {
      th: "ยินดีต้อนรับสู่วัดโปรไฟล์ แหล่งเรียนรู้และสืบทอดพระพุทธศาสนา",
      en: "Welcome to Wat Profile, a place of Buddhist learning and heritage.",
      de: "Willkommen im Wat Profile, einem Ort des buddhistischen Lernens.",
    },
    keywords: {
      th: "วัด, พระพุทธศาสนา, ทำบุญ, สวดมนต์",
      en: "temple, buddhism, merit making, chanting",
      de: "tempel, buddhismus, verdienst, gesang",
    },
    og_image: "https://images.unsplash.com/photo-1609137144814-4c5c76db3927?q=80&w=1000",
    canonical_url: "https://watprofile.org/th/home",
  },
  content: {
    hero_title: {
      th: "สืบสานประเพณีและวิถีพุทธ",
      en: "Preserving Traditions and the Buddhist Way",
      de: "Traditionen und den buddhistischen Weg bewahren",
    },
    hero_subtitle: {
      th: "ขอเชิญร่วมทำบุญและปฏิบัติธรรม ณ วัดโปรไฟล์",
      en: "Join us for merit-making and meditation at Wat Profile.",
      de: "Begleiten Sie uns zur Verdienstbildung und Meditation im Wat Profile.",
    },
    hero_image: "https://images.unsplash.com/photo-1609137144814-4c5c76db3927?q=80&w=1000",
    welcome_title: {
      th: "ยินดีต้อนรับสู่วัดโปรไฟล์",
      en: "Welcome to Wat Profile",
      de: "Willkommen im Wat Profile",
    },
    welcome_description: {
      th: "วัดโปรไฟล์เป็นศูนย์รวมจิตใจของพุทธศาสนิกชน ดำเนินกิจกรรมทางศาสนา เผยแผ่ธรรมะ และช่วยเหลือสังคมอย่างต่อเนื่อง ขอเชิญทุกท่านร่วมสืบทอดพระพุทธศาสนาไปด้วยกัน",
      en: "Wat Profile is a spiritual center for Buddhists, conducting religious activities, spreading Dharma, and continuously supporting society. We invite everyone to preserve Buddhism together.",
      de: "Wat Profile is a spiritual center for Buddhists, conducting religious activities, spreading Dharma, and continuously supporting society.",
    },
    features: [
      {
        icon: "🙏",
        title: {
          th: "การทำสมาธิปฏิบัติธรรม",
          en: "Meditation",
          de: "Meditation",
        },
        description: {
          th: "การเจริญสติวิปัสสนา ค้นพบความสงบจากภายในจิตใจ",
          en: "Mindfulness and Vipassana meditation to find inner peace.",
          de: "Achtsamkeits- und Vipassana-Meditation zur inneren Ruhe.",
        },
      },
      {
        icon: "🏫",
        title: {
          th: "โรงเรียนวันอาทิตย์",
          en: "Sunday School",
          de: "Sonntagsschule",
        },
        description: {
          th: "สอนภาษาไทย พระพุทธศาสนา และจริยธรรมให้เยาวชน",
          en: "Teaching Thai language, Buddhism, and ethics to youths.",
          de: "Unterricht in thailändischer Sprache, Buddhismus und Ethik für Jugendliche.",
        },
      },
      {
        icon: "🌺",
        title: {
          th: "ศิลปวัฒนธรรม",
          en: "Thai Culture",
          de: "Thailändische Kultur",
        },
        description: {
          th: "เรียนรู้นาฏศิลป์ ดนตรี และขนบธรรมเนียมประเพณีไทย",
          en: "Learn traditional Thai dance, music, and customs.",
          de: "Lernen Sie traditionellen thailändischen Tanz, Musik und Bräuche kennen.",
        },
      },
    ],
  },
};

const defaultContactMockData: ContactPageMasterFormData = {
  id: "contact-page-id",
  slug: "contact",
  status: "published",
  seo: {
    title: {
      th: "ติดต่อเรา - วัดโปรไฟล์",
      en: "Contact Us - Wat Profile",
      de: "Kontakt - Wat Profile",
    },
    description: {
      th: "ข้อมูลติดต่อ แผนที่ และฟอร์มสำหรับส่งข้อความถึงวัดโปรไฟล์",
      en: "Contact details, maps, and forms to send messages to Wat Profile.",
      de: "Kontaktdaten, Karten und Formulare zum Senden von Nachrichten an Wat Profile.",
    },
    keywords: {
      th: "ติดต่อ, เบอร์โทร, แผนที่, ที่อยู่",
      en: "contact, phone, map, address",
      de: "kontakt, telefon, karte, adresse",
    },
    og_image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1000",
    canonical_url: "https://watprofile.org/th/contact",
  },
  content: {
    hero_title: {
      th: "ติดต่อเรา",
      en: "Contact Us",
      de: "Kontaktieren Sie uns",
    },
    hero_subtitle: {
      th: "ช่องทางติดต่อ สอบถาม และแบบฟอร์มส่งข้อความ",
      en: "Channels for contact, inquiries, and feedback form.",
      de: "Kanäle für Kontakt, Anfragen und Feedback-Formular.",
    },
    hero_tone: "calm",
    info_title: {
      th: "ข้อมูลการติดต่อ",
      en: "Contact Information",
      de: "Kontaktinformationen",
    },
    info_description: {
      th: "ข้อมูลติดต่อ แผนที่ และฟอร์มสำหรับส่งข้อความถึงวัดโปรไฟล์",
      en: "Contact details, maps, and forms to send messages to Wat Profile.",
      de: "Kontaktdaten, Karten und Formulare zum Senden von Nachrichten an Wat Profile.",
    },
    address: {
      th: "Buddhistisches Meditationszentrum e.V., Am Pflaster 11, 63599 Biebergemünd",
      en: "Buddhistisches Meditationszentrum e.V., Am Pflaster 11, 63599 Biebergemünd",
      de: "Buddhistisches Meditationszentrum e.V., Am Pflaster 11, 63599 Biebergemünd",
    },
    phone: "0160-1604486",
    email: "Watloungporsai@gmail.com",
    show_social: true,
    show_bank: true,
    facebook: "https://www.facebook.com/wat.loungporsai.9",
    instagram: "https://www.instagram.com/watloungporsai/",
    messenger: "Wat loung por sai",
    opening_days: {
      th: "จันทร์ - อาทิตย์",
      en: "Monday - Sunday",
      de: "Montag - Sonntag",
    },
    opening_time: "09.00 - 21.00",
    opening_remark: {
      th: "ปล. ยกเว้นวันที่พระมีกิจนิมนต์นอกวัด",
      en: "Note: Except on days when the monk has an outside engagement",
      de: "Hinweis: Außer an Tagen, an denen der Mönch auswärts beschäftigt ist",
    },
    parking: {
      th: "มีที่จอดรถภายในวัด",
      en: "Parking available on-site",
      de: "Parkplätze vor Ort verfügbar",
    },
    directions_url: "https://www.google.com/maps/search/?api=1&query=Am+Pflaster+11,+63599+Biebergemünd",
    public_transport: [
      {
        icon: "train",
        text: {
          th: "นั่งรถไฟ ลง สถานี Gelnhausen",
          en: "Take the train to Gelnhausen Station",
          de: "Fahren Sie mit der Bahn bis zum Bahnhof Gelnhausen",
        },
      },
      {
        icon: "bus",
        text: {
          th: "ต่อรถเมล์ สาย MKK64 ลงป้าย Bieber Rathaus, Biebergemünd (วัดอยู่ตรงข้ามป้ายรถเมล์)",
          en: "Transfer to Bus MKK64, get off at Bieber Rathaus, Biebergemünd (Temple is opposite the bus stop)",
          de: "Nehmen Sie den Bus MKK64, steigen Sie an der Haltestelle Bieber Rathaus, Biebergemünd aus (Der Tempel befindet sich gegenüber)",
        },
      },
    ],
    car_directions: {
      th: "รถยนต์ส่วนบุคคล เปิด GPS นำทางไปที่ 'Wat Loung Por Sai' หรือ 'Am Pflaster 11, 63599 Biebergemünd'",
      en: "For personal car, enter 'Wat Loung Por Sai' or 'Am Pflaster 11, 63599 Biebergemünd' into your GPS",
      de: "Wenn Sie mit dem Auto anreisen, geben Sie 'Wat Loung Por Sai' oder 'Am Pflaster 11, 63599 Biebergemünd' in Ihr GPS ein",
    },
    map_embed_url: "https://maps.google.com/maps?q=Am+Pflaster+11,+63599+Biebergemünd&t=&z=15&ie=UTF8&iwloc=&output=embed",
    map_location_name: "Wat Loung Por Sai",
    bank_name: "Buddhistisches Meditationszentrum Verein e. V. / VR Bank",
    bank_account: "Wat Loung Por Sai",
    bank_iban: "DE05 5066 1639 0004 3138 60",
    bank_bic: "GENODEF1LSR",
    form_title: {
      th: "ส่งข้อความถึงเรา",
      en: "Send Us a Message",
      de: "Schicken Sie uns eine Nachricht",
    },
    form_description: {
      th: "หากมีข้อสงสัยหรือคำแนะนำ สามารถกรอกฟอร์มส่งถึงทีมงานวัดได้โดยตรง",
      en: "If you have any questions or feedback, please fill out the form.",
      de: "Wenn Sie Fragen oder Feedback haben, füllen Sie bitte das Formular aus.",
    },
    form_enabled: true,
  },
};



// Helper to load from LocalStorage or default
const loadMockData = (): HomePageMasterFormData => {
  if (typeof window === "undefined") return defaultMockData;
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultMockData));
    return defaultMockData;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultMockData;
  }
};

const loadContactMockData = (): ContactPageMasterFormData => {
  if (typeof window === "undefined") return defaultContactMockData;
  const raw = localStorage.getItem(CONTACT_LOCAL_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(CONTACT_LOCAL_STORAGE_KEY, JSON.stringify(defaultContactMockData));
    return defaultContactMockData;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultContactMockData;
  }
};

// Helpers to save to LocalStorage
const saveMockData = (data: HomePageMasterFormData) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

const saveContactMockData = (data: ContactPageMasterFormData) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTACT_LOCAL_STORAGE_KEY, JSON.stringify(data));
};

export function useHomePageQuery() {
  return useQuery({
    queryKey: ["website-page-master", "home"],
    queryFn: async () => {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 500));
      return loadMockData();
    },
  });
}

export function useUpdateHomePageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedData: HomePageMasterFormData) => {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 1000));
      saveMockData(updatedData);
      return updatedData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["website-page-master", "home"], data);
    },
  });
}

export function useContactPageQuery() {
  return useQuery({
    queryKey: ["website-page-master", "contact"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return loadContactMockData();
    },
  });
}

export function useUpdateContactPageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedData: ContactPageMasterFormData) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      saveContactMockData(updatedData);
      return updatedData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["website-page-master", "contact"], data);
    },
  });
}

export function useAboutPageQuery() {
  return useQuery({
    queryKey: ["website-page-master", "about"],
    queryFn: () => websiteCmsAdminService.getPage("PAGE-ABOUT"),
  });
}

export function useUpdateAboutPageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContentPage> }) =>
      websiteCmsAdminService.updatePage(id, payload),
    onSuccess: (page) => {
      queryClient.setQueryData(["website-page-master", "about"], page);
      queryClient.invalidateQueries({ queryKey: ["website-cms"] });
    },
  });
}

// Live-API backed hooks for Privacy Policy page
export function usePrivacyPageQuery() {
  return useQuery({
    queryKey: ["website-page-master", "privacy"],
    queryFn: () => websiteCmsAdminService.getPage("PAGE-PRIVACY"),
  });
}

export function useUpdatePrivacyPageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContentPage> }) =>
      websiteCmsAdminService.updatePage(id, payload),
    onSuccess: (page) => {
      queryClient.setQueryData(["website-page-master", "privacy"], page);
      queryClient.invalidateQueries({ queryKey: ["website-cms"] });
    },
  });
}

export function usePublishPrivacyPageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => websiteCmsAdminService.publishPage(id),
    onSuccess: (page) => {
      queryClient.setQueryData(["website-page-master", "privacy"], page);
      queryClient.invalidateQueries({ queryKey: ["website-cms"] });
    },
  });
}

// Live-API backed hooks for Impressum page
export function useImpressumPageQuery() {
  return useQuery({
    queryKey: ["website-page-master", "impressum"],
    queryFn: () => websiteCmsAdminService.getPage("PAGE-IMPRESSUM"),
  });
}

export function useUpdateImpressumPageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContentPage> }) =>
      websiteCmsAdminService.updatePage(id, payload),
    onSuccess: (page) => {
      queryClient.setQueryData(["website-page-master", "impressum"], page);
      queryClient.invalidateQueries({ queryKey: ["website-cms"] });
    },
  });
}

export function usePublishImpressumPageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => websiteCmsAdminService.publishPage(id),
    onSuccess: (page) => {
      queryClient.setQueryData(["website-page-master", "impressum"], page);
      queryClient.invalidateQueries({ queryKey: ["website-cms"] });
    },
  });
}
