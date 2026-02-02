import i18n, { type SupportedLanguage } from './i18n';

const LOCALE_MAPPING: Record<SupportedLanguage, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  lv: 'lv-LV',
  'en-ps': 'en-US',
};

export function formatDate(date: Date, style: 'short' | 'long' = 'short'): string {
  const locale = LOCALE_MAPPING[i18n.language as SupportedLanguage] || 'en-US';

  const options: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'numeric', day: 'numeric' };

  return date.toLocaleDateString(locale, options);
}

export function formatDateTime(date: Date): string {
  const locale = LOCALE_MAPPING[i18n.language as SupportedLanguage] || 'en-US';

  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0];
}
