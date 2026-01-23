export type Locale = 'th' | 'en';

export type LocalizedText = {
    th: string;
    en: string;
};

export type SocialLinks = {
    line?: string;
    facebook?: string;
    instagram?: string;
    behance?: string;
    pinterest?: string;
    email?: string;
    twitter?: string;
    github?: string;
    youtube?: string;
};

export type LogoConfig = {
    light: string;
    dark: string;
};

export type ThemeConfig = {
    colorPrimary: string;
    colorAccent: string;
};

export type SeoConfig = {
    titleTemplate: string;
    defaultTitle: string;
    defaultDescription: string;
    defaultOgImage: string;
    keywords: string[];
};

export type ContactInfo = {
    email?: string;
    phone?: string;
    phone2?: string;
    address?: LocalizedText;
    googleMapUrl?: string;
};

export type BusinessInfo = {
    legalName?: string;
    registrationId?: string;
    taxId?: string;
};

export type IntegrationConfig = {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    metaPixelId?: string;
    sentryDsn?: string;
};

export type LayoutConfig = {
    containerWidth: 'narrow' | 'normal' | 'wide';
    headerStyle: 'minimal' | 'withBorder';
    footerStyle: 'minimal' | 'full';
    enableScrollAnimation: boolean;
    socialSidebarPosition: 'left' | 'right';
};

export type FeatureFlags = {
    enableEvents: boolean;
    enableDonations: boolean;
    showCookieBanner: boolean;
};

export type SiteConfig = {
    siteName: LocalizedText;
    siteShortName?: string;
    tagline?: LocalizedText;
    domain: string;

    defaultLocale: Locale;
    locales: Locale[];

    logo: LogoConfig;
    theme: ThemeConfig;

    social: SocialLinks;

    seo: SeoConfig;

    contact: ContactInfo;
    business?: BusinessInfo;

    layout: LayoutConfig;

    integrations?: IntegrationConfig;

    features: FeatureFlags;

    authors?: { name: string; url?: string }[];
    creator?: string;
};

export const siteConfig: SiteConfig = {
    siteName: {
        th: 'วัดเสริมรังษี',
        en: 'Wat Serm Rangsi',
    },
    siteShortName: 'Wat Serm Rangsi',
    tagline: {
        th: 'ศูนย์รวมจิตใจชาวพุทธ',
        en: 'Buddhist Meditation Center',
    },
    domain: 'https://wat-serm-rangsi.vercel.app', // Placeholder

    defaultLocale: 'th',
    locales: ['th', 'en'],

    logo: {
        light: '/images/logo-light.svg', // Placeholder
        dark: '/images/logo-dark.svg',   // Placeholder
    },

    theme: {
        colorPrimary: '#5D4037', // Bronze/Dark Brown from reference
        colorAccent: '#FFD700',  // Gold
    },

    social: {
        facebook: 'https://www.facebook.com/watsermrangsi', // Placeholder
        email: 'contact@watsermrangsi.org', // Placeholder
        youtube: 'https://www.youtube.com/@watsermrangsi' // Placeholder
    },

    seo: {
        titleTemplate: '%s | วัดเสริมรังษี',
        defaultTitle: 'วัดเสริมรังษี | Wat Serm Rangsi',
        defaultDescription:
            'วัดเสริมรังษี - ศูนย์รวมจิตใจชาวพุทธ เผยแผ่พระพุทธศาสนา และจัดกิจกรรมทางศาสนา',
        defaultOgImage: '/images/og-image.jpg',
        keywords: [
            'วัดเสริมรังษี',
            'Wat Serm Rangsi',
            'Buddhist Temple',
            'Meditation',
            'Dhamma',
            'Buddhism',
            'ทำบุญ',
            'ปฏิบัติธรรม',
        ],
    },

    contact: {
        email: 'contact@watsermrangsi.org',
        phone: '+66-xx-xxx-xxxx',
        address: {
            th: 'ที่อยู่ภาษาไทย',
            en: 'Address in English',
        },
        googleMapUrl: 'https://maps.google.com/...' // Placeholder
    },

    layout: {
        containerWidth: 'normal',
        headerStyle: 'minimal',
        footerStyle: 'full',
        enableScrollAnimation: true,
        socialSidebarPosition: 'right',
    },

    integrations: {
        googleAnalyticsId: '',
    },

    features: {
        enableEvents: true,
        enableDonations: true,
        showCookieBanner: true,
    },

    authors: [
        {
            name: 'Wat Serm Rangsi Team',
        },
    ],
    creator: 'Wat Serm Rangsi Team',
};
