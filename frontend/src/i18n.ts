import { routing } from './routing';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as "th" | "en" | "de")) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default,
        timeZone: 'Europe/Berlin',
        onError(error) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`[next-intl] ${error.message}`);
            }
        },
        getMessageFallback({ key, namespace }) {
            return `${namespace ? namespace + '.' : ''}${key}`;
        }
    };
});
