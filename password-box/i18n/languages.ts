export type LangCode =
  | 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt'
  | 'nl' | 'ar' | 'ru' | 'zh' | 'ja' | 'tr' | 'pl';

export interface LangMeta {
  code: LangCode;
  nativeName: string;
  rtl: boolean;
}

export const LANGUAGES: LangMeta[] = [
  { code: 'en', nativeName: 'English', rtl: false },
  { code: 'fr', nativeName: 'Français', rtl: false },
  { code: 'es', nativeName: 'Español', rtl: false },
  { code: 'de', nativeName: 'Deutsch', rtl: false },
  { code: 'it', nativeName: 'Italiano', rtl: false },
  { code: 'pt', nativeName: 'Português', rtl: false },
  { code: 'nl', nativeName: 'Nederlands', rtl: false },
  { code: 'ar', nativeName: 'العربية', rtl: true },
  { code: 'ru', nativeName: 'Русский', rtl: false },
  { code: 'zh', nativeName: '中文（简体）', rtl: false },
  { code: 'ja', nativeName: '日本語', rtl: false },
  { code: 'tr', nativeName: 'Türkçe', rtl: false },
  { code: 'pl', nativeName: 'Polski', rtl: false },
];

export const DEFAULT_LANG: LangCode = 'en';
