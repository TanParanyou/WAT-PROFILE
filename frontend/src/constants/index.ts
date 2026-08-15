import type { Locale } from '@/config/site.config';
import type { MultiLangText } from '@/types/api';

// รองรับภาษา
export const LOCALES: Locale[] = ['th', 'en', 'de'];
export const DEFAULT_LOCALE: Locale = 'th';

// ค่าเริ่มต้น MultiLangText ว่างเปล่า
export const EMPTY_MULTI_LANG: MultiLangText = { th: '', en: '', de: '' };
export const emptyLang: MultiLangText = EMPTY_MULTI_LANG;

// Locales สำหรับ RichText
export const RICH_TEXT_LOCALES = ['th', 'en', 'de'] as const;
export const richTextLocales = RICH_TEXT_LOCALES;

export type RichTextLocaleConfig = { code: string; label: string };
export const DEFAULT_RICH_TEXT_LOCALE_CONFIGS: readonly RichTextLocaleConfig[] = [
    { code: 'th', label: 'TH' },
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
] as const;
export const richTextLocaleConfigs = DEFAULT_RICH_TEXT_LOCALE_CONFIGS;

// Timezone ค่าเริ่มต้นของระบบ (เยอรมนี / Europe/Berlin)
export const DEFAULT_TIMEZONE = 'Europe/Berlin';
export const TIMEZONE = DEFAULT_TIMEZONE;

// เส้นทางหน้าเว็บ
export const ROUTES = {
    HOME: '/',
    ABOUT: '/about',
    EVENTS: '/events',
    GALLERY: '/gallery',
    MONKS: '/monks',
    CONTACT: '/contact',
    PRIVACY: '/privacy',
    IMPRESSUM: '/impressum',
} as const;

// ค่าเริ่มต้นของ Framer Motion animations
export const FADE_IN_UP = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
} as const;

export const FADE_IN = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
} as const;

export const STAGGER_CONTAINER = {
    animate: {
        transition: { staggerChildren: 0.1 },
    },
} as const;
