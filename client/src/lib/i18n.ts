import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
    console.warn('Failed to read language from localStorage:', e);
  }
  return getBrowserLanguage();
}

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
    resources: {},
  });

// Load translation file for a specific language
async function loadLanguageResources(lng: SupportedLanguage): Promise<void> {
  try {
    const response = await fetch(`/locales/${lng}/translation.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lng} translations: ${response.statusText}`);
    }
    const resources = await response.json();
    i18n.addResourceBundle(lng, 'translation', resources, true, true);
  } catch (error) {
    console.error(`Failed to load ${lng} translations:`, error);
    if (lng !== 'en') {
      console.warn(`Falling back to English for language: ${lng}`);
    }
  }
}

// Change language and persist the choice
export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  // Load resources if not already loaded
  if (!i18n.hasResourceBundle(lng, 'translation')) {
    await loadLanguageResources(lng);
  }
  
  // Change language
  await i18n.changeLanguage(lng);
  
  // Persist to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch (e) {
    console.warn('Failed to persist language choice:', e);
  }
}

// Load initial language resources
loadLanguageResources(getInitialLanguage());

export default i18n;
