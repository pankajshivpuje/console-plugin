import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../../locales/en/plugin__pipelines-console-plugin.json';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      'plugin__pipelines-console-plugin': en,
    },
  },
  lng: 'en',
  ns: ['plugin__pipelines-console-plugin'],
  defaultNS: 'plugin__pipelines-console-plugin',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
