import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import es from './es.json';

export const SUPPORTED_LOCALES = ['es', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

// Follows the device language; any other language falls back to Spanish.
export function resolveLocale(
  languageCode: string | null | undefined,
): AppLocale {
  return SUPPORTED_LOCALES.find((locale) => locale === languageCode) ?? 'es';
}

export const deviceLocale = (): AppLocale =>
  resolveLocale(getLocales()[0]?.languageCode);

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: deviceLocale(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

export default i18n;
