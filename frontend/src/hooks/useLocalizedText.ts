import { useLocale } from 'next-intl';
import { getLocalizedText } from '@/utils/i18n';
import type { LocalizedText } from '@/types/common';

/**
 * Hook สำหรับแปลข้อความจาก LocalizedText object ตาม locale ปัจจุบัน
 */
export function useLocalizedText() {
    const locale = useLocale();
    return (obj: LocalizedText) => getLocalizedText(obj, locale);
}
