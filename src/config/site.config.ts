export type Locale = 'th' | 'en' | 'de';

export type LocalizedText = {
    th: string;
    en: string;
    de: string;
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

export type AddressDetails = {
    streetAddress: string;
    addressLocality: string;
    postalCode: string;
    addressCountry: string;
};

export type GeoLocation = {
    latitude: number;
    longitude: number;
};

export type OpeningHours = {
    dayOfWeek: string[];
    opens: string;
    closes: string;
};

export type ContactInfo = {
    email?: string;
    phone?: string;
    phone2?: string;
    address?: LocalizedText;
    addressDetails?: AddressDetails;
    geo?: GeoLocation;
    openingHours?: OpeningHours[];
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
        th: 'วัดหลวงพ่อใส',
        en: 'Wat Loung Por Sai',
        de: 'Wat Loung Por Sai',
    },
    siteShortName: 'Wat Loung Por Sai',
    tagline: {
        th: 'ศูนย์รวมจิตใจชาวพุทธ',
        en: 'Buddhist Meditation Center',
        de: 'Buddhist Meditation Center',
    },
    domain: 'https://sermrangsi.vercel.app', // Placeholder

    defaultLocale: 'th',
    locales: ['th', 'en', 'de'],

    logo: {
        light: '/images/logo-light.svg', // Placeholder
        dark: '/images/logo-dark.svg',   // Placeholder
    },

    theme: {
        colorPrimary: '#5D4037', // Bronze/Dark Brown from reference
        colorAccent: '#FFD700',  // Gold
    },

    social: {
        facebook: 'https://www.facebook.com/wat.loungporsai.9',
        email: 'Watloungporsai@gmail.com',
        //youtube: 'https://youtu.be/oN2Ntvx_zKU?si=DLXfokvu4XmhcIu0' // Placeholder
    },

    seo: {
        titleTemplate: '%s | วัดหลวงพ่อใส',
        defaultTitle: 'วัดหลวงพ่อใส | Wat Loung Por Sai',
        defaultDescription:
            'วัดหลวงพ่อใส - ศูนย์รวมจิตใจชาวพุทธ เผยแผ่พระพุทธศาสนา และจัดกิจกรรมทางศาสนา',
        defaultOgImage: '/images/og-image.jpg',
        keywords: [
            'วัดหลวงพ่อใส',
            'Wat Loung Por Sai',
            'Buddhist Temple',
            'Meditation',
            'Dhamma',
            'Buddhism',
            'ทำบุญ',
            'ปฏิบัติธรรม',
        ],
    },

    contact: {
        email: 'Watloungporsai@gmail.com',
        phone: '0160-1604486',
        address: {
            th: 'Buddhistisches Meditationszentrum e.V.Am Pflaster 11, 63599 Biebergemünd',
            en: 'Buddhistisches Meditationszentrum e.V.Am Pflaster 11, 63599 Biebergemünd',
            de: 'Buddhistisches Meditationszentrum e.V.Am Pflaster 11, 63599 Biebergemünd'
        },
        addressDetails: {
            streetAddress: 'Am Pflaster 11',
            addressLocality: 'Biebergemünd',
            postalCode: '63599',
            addressCountry: 'DE',
        },
        geo: {
            latitude: 50.228,
            longitude: 9.288,
        },
        openingHours: [
            {
                dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                ],
                opens: '08:00',
                closes: '18:00',
            },
        ],
        googleMapUrl: 'https://maps.app.goo.gl/JfSweaU6LYLtFdfw7'
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
            name: 'Wat Loung Por Sai Team',
        },
    ],
    creator: 'Wat Loung Por Sai Team',
};
