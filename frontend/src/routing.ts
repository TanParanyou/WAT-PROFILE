import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['th', 'en', 'de'],
    defaultLocale: 'th',
    localePrefix: 'always'
});
