import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales-en.json';

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

// Initialize i18n with English resources pre-loaded
const initialLanguage = getInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded', // Re-render on language change and resource load
      bindI18nStore: 'added removed', // Re-render when resources are added/removed
      transEmptyNodeValue: '', // What to return for empty Trans components
      transSupportBasicHtmlNodes: true, // Allow basic HTML in translations
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'], // Allowed HTML tags
    },
    // Pre-load English as fallback - ensures components always have translations available
    resources: {
      en: {
        translation: enTranslations,
      },
    },
  });

console.log('[i18n] Initialized with English fallback, initial language:', initialLanguage);

// Load translation file for a specific language
async function loadLanguageResources(lng: SupportedLanguage): Promise<void> {
  // English is already loaded during init
  if (lng === 'en') {
    console.log(`[i18n] English resources already loaded during init`);
    return;
  }
  
  // Check if already loaded using i18n's built-in method
  if (i18n.hasResourceBundle(lng, 'translation')) {
    console.log(`[i18n] Resources for ${lng} already loaded`);
    return;
  }
  
  console.log(`[i18n] Loading resources for ${lng}...`);
  try {
    const response = await fetch(`/locales/${lng}/translation.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${lng} translations: ${response.statusText}`);
    }
    const resources = await response.json();
    // Use deep merge to properly add resources
    i18n.addResourceBundle(lng, 'translation', resources, true, true);
    console.log(`[i18n] Successfully loaded resources for ${lng}`);
  } catch (error) {
    console.error(`[i18n] Failed to load ${lng} translations:`, error);
    console.warn(`[i18n] Falling back to English for language: ${lng}`);
  }
}

// Change language and persist the choice
export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  console.log(`[i18n] Changing language to ${lng}...`);
  try {
    // Load resources if not already loaded (English is pre-loaded)
    await loadLanguageResources(lng);
    
    // Change language (this will trigger re-renders due to bindI18n config)
    await i18n.changeLanguage(lng);
    console.log(`[i18n] Language changed to ${lng}, current language: ${i18n.language}`);
    
    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, lng);
    } catch (e) {
      console.warn('[i18n] Failed to persist language choice:', e);
    }
  } catch (error) {
    console.error('[i18n] Error changing language:', error);
    // Fall back to English
    if (lng !== 'en') {
      await i18n.changeLanguage('en');
    }
  }
}

// Load the initial language resources if not English
if (initialLanguage !== 'en') {
  (async () => {
    console.log(`[i18n] Loading initial language: ${initialLanguage}`);
    await loadLanguageResources(initialLanguage);
    await i18n.changeLanguage(initialLanguage);
    console.log(`[i18n] Initialization complete, current language: ${i18n.language}`);
  })();
}

export default i18n;
