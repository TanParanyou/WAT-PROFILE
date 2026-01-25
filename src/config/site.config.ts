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
        th: 'เสริมรังษี ศูนย์ปฏิบัติธรรม',
        en: 'Serm Rangsi Meditation Center',
    },
    siteShortName: 'Serm Rangsi',
    tagline: {
        th: 'ศูนย์รวมจิตใจชาวพุทธ',
        en: 'Buddhist Meditation Center',
    },
    domain: 'https://sermrangsi.vercel.app', // Placeholder

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
        facebook: 'https://www.facebook.com/pages/%E0%B9%80%E0%B8%AA%E0%B8%A3%E0%B8%B4%E0%B8%A1%E0%B8%A3%E0%B8%B1%E0%B8%87%E0%B8%A9%E0%B8%B5-%E0%B8%A8%E0%B8%B9%E0%B8%99%E0%B8%A2%E0%B9%8C%E0%B8%9B%E0%B8%8F%E0%B8%B4%E0%B8%9A%E0%B8%B1%E0%B8%95%E0%B8%B4%E0%B8%98%E0%B8%A3%E0%B8%A3%E0%B8%A1/109598142460157',
        email: 'contact@watsermrangsi.org',
        youtube: 'https://youtu.be/oN2Ntvx_zKU?si=DLXfokvu4XmhcIu0' // Placeholder
    },

    seo: {
        titleTemplate: '%s | เสริมรังษี ศูนย์ปฏิบัติธรรม',
        defaultTitle: 'เสริมรังษี ศูนย์ปฏิบัติธรรม | Serm Rangsi',
        defaultDescription:
            'เสริมรังษี ศูนย์ปฏิบัติธรรม - ศูนย์รวมจิตใจชาวพุทธ เผยแผ่พระพุทธศาสนา และจัดกิจกรรมทางศาสนา',
        defaultOgImage: '/images/og-image.jpg',
        keywords: [
            'เสริมรังษี',
            'Serm Rangsi',
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
        phone: '062 540 4922',
        address: {
            th: 'ต.หนองย่างเสือ อ.มวกเหล็ก จ.สระบุรี 18180',
            en: 'Unnamed Rd, Tambon Nong Yang Sua, Amphoe Muak Lek, Saraburi 18180',
        },
        googleMapUrl: 'https://maps.app.goo.gl/gTxKSwCd99EGSuoH6'
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
            name: 'Serm Rangsi Team',
        },
    ],
    creator: 'Serm Rangsi Team',
};
