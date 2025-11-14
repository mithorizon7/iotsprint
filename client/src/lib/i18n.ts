import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { logger } from './logger';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English' },
  ru: { name: 'Russian', nativeName: 'Русский' },
  lv: { name: 'Latvian', nativeName: 'Latviešu' },
  'en-ps': { name: 'Pseudo (Test)', nativeName: '[Ṕśéúðö]' }, // For testing text expansion
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

const STORAGE_KEY = 'iot-game-language';

// Get browser's preferred language
function getBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.split('-')[0];
  return (browserLang in SUPPORTED_LANGUAGES ? browserLang : 'en') as SupportedLanguage;
}

// Get stored language or browser language
function getInitialLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguage;
    }
  } catch (e) {
    logger.warn('Failed to read language from localStorage:', e);
  }
  return getBrowserLanguage();
}

// Initialize i18n with English resources pre-loaded
const initialLanguage = getInitialLanguage();

// SIMPLIFIED APPROACH: Pre-load ALL languages synchronously
import enTranslations from '@/locales-en.json';
// Note: We'll load other languages dynamically on demand since they're larger

//Initialize i18n with simplified config
i18n
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    nonExplicitSupportedLngs: false, // Preserve exact codes like 'en-ps'
    load: 'currentOnly', // CRITICAL: Force exact language code matching for 'en-ps'
    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: '.',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    },
    resources: {
      en: {
        translation: enTranslations
      }
    },
  });

logger.log('[i18n] Initialized, current language:', i18n.language, 'resolved:', i18n.resolvedLanguage);

// SIMPLIFIED: Load language resources only if needed
async function loadLanguageIfNeeded(lng: SupportedLanguage): Promise<void> {
  if (i18n.hasResourceBundle(lng, 'translation')) {
    logger.log(`[i18n] ${lng} already loaded`);
    return;
  }
  
  logger.log(`[i18n] Loading ${lng}...`);
  const response = await fetch(`/locales/${lng}/translation.json`);
  if (!response.ok) {
    throw new Error(`Failed to load ${lng}`);
  }
  const resources = await response.json();
  i18n.addResourceBundle(lng, 'translation', resources, true, true);
  logger.log(`[i18n] ${lng} loaded, sample:`, resources?.game?.title);
}

// SIMPLIFIED: Just change language - let i18next handle everything
export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  logger.log(`[i18n] Switching to ${lng}...`);
  
  // Load resources if needed
  await loadLanguageIfNeeded(lng);
  
  // Change language - i18next should handle resolvedLanguage automatically
  await i18n.changeLanguage(lng);
  
  // Persist choice
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch (e) {
    logger.warn('[i18n] localStorage save failed:', e);
  }
  
  logger.log(`[i18n] Now: language=${i18n.language}, resolved=${i18n.resolvedLanguage}`);
  logger.log(`[i18n] Test t('game.title'):`, i18n.t('game.title'));
}

// Load initial language if not English
if (initialLanguage !== 'en') {
  loadLanguageIfNeeded(initialLanguage)
    .then(() => i18n.changeLanguage(initialLanguage))
    .catch(err => logger.error('[i18n] Failed to load initial language:', err));
}

export default i18n;
