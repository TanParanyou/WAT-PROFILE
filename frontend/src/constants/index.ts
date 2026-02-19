import type { Locale } from '@/config/site.config';

// รองรับภาษา
export const LOCALES: Locale[] = ['th', 'en', 'de'];
export const DEFAULT_LOCALE: Locale = 'th';

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
