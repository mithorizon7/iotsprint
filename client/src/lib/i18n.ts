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

// Initialize i18n with English resources pre-loaded
const initialLanguage = getInitialLanguage();

// Initialize i18n WITHOUT pre-loaded resources - load everything dynamically
i18n
  .use(initReactI18next)
  .init({
    lng: 'en', // Start with English
    fallbackLng: 'en', // Fallback to English for missing keys
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    ns: ['translation'],
    defaultNS: 'translation',
    keySeparator: '.', // Use dot notation for nested keys
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
    // No pre-loaded resources - load everything dynamically for consistency
  });

console.log('[i18n] Initialized, will load resources for:', initialLanguage);

// Load translation file for a specific language (including English)
async function loadLanguageResources(lng: SupportedLanguage): Promise<void> {
  // Check if already loaded using i18n's built-in method
  if (i18n.hasResourceBundle(lng, 'translation')) {
    console.log(`[i18n] Resources for ${lng} already loaded`);
    return;
  }
  
  console.log(`[i18n] Loading resources for ${lng}...`);
  try {
    const url = `/locales/${lng}/translation.json`;
    console.log(`[i18n] Fetching from:`, url);
    const response = await fetch(url);
    console.log(`[i18n] Response status:`, response.status, response.statusText);
    if (!response.ok) {
      throw new Error(`Failed to load ${lng} translations: ${response.statusText}`);
    }
    const resources = await response.json();
    console.log(`[i18n] JSON parsed, keys:`, Object.keys(resources));
    console.log(`[i18n] Sample (game.title):`, resources?.game?.title);
    
    // Add resource bundle fresh (no pre-existing bundle to merge with)
    i18n.addResourceBundle(lng, 'translation', resources, true, true);
    console.log(`[i18n] Bundle added for ${lng}`);
    
    // Verify
    const hasIt = i18n.hasResourceBundle(lng, 'translation');
    console.log(`[i18n] Verify has bundle:`, hasIt);
    if (hasIt) {
      const retrieved = i18n.getResourceBundle(lng, 'translation');
      console.log(`[i18n] Retrieved keys:`, Object.keys(retrieved || {}));
      console.log(`[i18n] Retrieved game.title:`, retrieved?.game?.title);
    }
    
    console.log(`[i18n] Successfully loaded resources for ${lng}`);
  } catch (error) {
    console.error(`[i18n] Failed to load ${lng} translations:`, error);
    throw error; // Don't silently fail
  }
}

// Change language and persist the choice
export async function changeLanguage(lng: SupportedLanguage): Promise<void> {
  console.log(`[i18n] Changing language to ${lng}...`);
  try {
    // FIRST: Load resources for target language (keep old ones for now)
    await loadLanguageResources(lng);
    console.log(`[i18n] Resources loaded for ${lng}`);
    
    // SECOND: Change language (now both old and new bundles exist)
    await i18n.changeLanguage(lng);
    console.log(`[i18n] Language changed to ${lng}, current language: ${i18n.language}`);
    
    // THIRD: Remove all OTHER language bundles (cleanup)
    const allLanguages = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];
    for (const lang of allLanguages) {
      if (lang !== lng && i18n.hasResourceBundle(lang, 'translation')) {
        i18n.removeResourceBundle(lang, 'translation');
        console.log(`[i18n] Cleaned up bundle for ${lang}`);
      }
    }
    
    // Test translation with explicit namespace
    const testTranslation = i18n.t('game.title', { ns: 'translation', lng });
    console.log(`[i18n] Test t('game.title', {ns:'translation', lng:'${lng}'}) =`, testTranslation);
    
    // Test without explicit lng (should use current language)
    const testDefault = i18n.t('game.title');
    console.log(`[i18n] Test t('game.title') =`, testDefault);
    
    // Test nested key
    const testNested = i18n.t('onboarding.intro');
    console.log(`[i18n] Test t('onboarding.intro') =`, testNested);
    
    // Debug i18next state
    console.log(`[i18n] i18n.language =`, i18n.language);
    console.log(`[i18n] i18n.languages =`, i18n.languages);
    console.log(`[i18n] i18n.resolvedLanguage =`, i18n.resolvedLanguage);
    
    // Check if key exists
    const exists = i18n.exists('game.title');
    console.log(`[i18n] exists('game.title') =`, exists);
    
    // Try to get raw resource
    const rawBundle = i18n.getResourceBundle(lng, 'translation');
    console.log(`[i18n] Raw bundle structure check - game key exists:`, rawBundle?.game ? 'YES' : 'NO');
    if (rawBundle?.game) {
      console.log(`[i18n] Raw bundle game.title:`, rawBundle.game.title);
    }
    
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

// Load initial language resources (including English)
(async () => {
  console.log(`[i18n] Loading initial language: ${initialLanguage}`);
  try {
    await loadLanguageResources(initialLanguage);
    await i18n.changeLanguage(initialLanguage);
    console.log(`[i18n] Initialization complete, current language: ${i18n.language}`);
  } catch (error) {
    console.error('[i18n] Failed to load initial language, app may not work correctly:', error);
  }
})();

export default i18n;
