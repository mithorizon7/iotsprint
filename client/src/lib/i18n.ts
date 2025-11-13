import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
    resources: {
      en: {
        translation: {},
      },
    },
  });

// Load translation asynchronously
fetch('/locales/en/translation.json')
  .then((response) => response.json())
  .then((resources) => {
    i18n.addResourceBundle('en', 'translation', resources, true, true);
  })
  .catch((error) => {
    console.error('Failed to load translations:', error);
  });

export default i18n;
