import { LocalizedText } from '@/types/common';

export const getLocalizedText = (obj: LocalizedText, locale: string): string => {
    return obj[locale as keyof LocalizedText] || obj['th'];
};
