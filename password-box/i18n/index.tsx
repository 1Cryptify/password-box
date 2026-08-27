import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { I18nManager, DevSettings } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LANGUAGES,
  DEFAULT_LANG,
  type LangCode,
} from './languages';
import { dictionaries, type TranslationKey } from './translations';

const STORAGE_KEY = '@passwordbox_lang';

const RTL_CODES: LangCode[] = ['ar'];

interface I18nContextValue {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  isRTL: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  tt: (keyOrText: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function applyRtl(code: LangCode, forceReload = false) {
  try {
    I18nManager.allowRTL(true);
    const shouldRtl = RTL_CODES.includes(code);
    if (I18nManager.isRTL !== shouldRtl) {
      I18nManager.forceRTL(shouldRtl);
      forceReload = true;
    }
    if (forceReload) {
      setTimeout(() => {
        try {
          DevSettings.reload();
        } catch {
          // reload indisponible : on continue sans redémarrer
        }
      }, 300);
    }
  } catch {
    // gestion du RTL non critique
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);

  useEffect(() => {
    (async () => {
      let code: LangCode = DEFAULT_LANG;
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && (dictionaries as Record<string, object>)[saved]) {
          code = saved as LangCode;
        }
      } catch {
        // langue par défaut
      }
      applyRtl(code);
      setLangState(code);
    })();
    return () => {};
  }, []);

  const setLang = useCallback((code: LangCode) => {
    setLangState((prev) => {
      const needRtl = RTL_CODES.includes(code) !== RTL_CODES.includes(prev);
      if (needRtl) applyRtl(code, true);
      return code;
    });
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const dict = dictionaries[lang] ?? dictionaries[DEFAULT_LANG];
      let str = dict[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.split(`{${k}}`).join(String(v));
        }
      }
      return str;
    },
    [lang]
  );

  const tt = useCallback(
    (keyOrText: string) => {
      const dict = dictionaries[lang] ?? dictionaries[DEFAULT_LANG];
      return dict[keyOrText as TranslationKey] ?? keyOrText;
    },
    [lang]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      isRTL: RTL_CODES.includes(lang),
      t,
      tt,
    }),
    [lang, setLang, t, tt]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export { LANGUAGES, DEFAULT_LANG, type LangCode };
