/**
 * Минимальный i18n без библиотеки.
 *
 * - LocaleProvider хранит текущую локаль в localStorage и обновляет <html lang>.
 * - useLocale() возвращает { locale, setLocale, t } для UI-строк.
 * - tr() — утилита для значений из mock-данных формата { ru, en } или строки.
 *
 * SSR-safe: на сервере дефолтит к "ru", клиент гидрирует из localStorage в layout-эффекте.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { dict, type Dict } from "./dict";

export type Locale = "ru" | "en";

const STORAGE_KEY = "botme.locale";
const DEFAULT_LOCALE: Locale = "ru";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: <K extends keyof Dict["ru"]>(key: K) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Гидрация из localStorage после mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ru" || saved === "en") {
      setLocaleState(saved);
    }
  }, []);

  // Синхронизируем <html lang>.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const t = useCallback<LocaleContextValue["t"]>(
    (key) => {
      const bundle = dict[locale] ?? dict[DEFAULT_LOCALE];
      return bundle[key] ?? dict[DEFAULT_LOCALE][key] ?? String(key);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Безопасный фолбэк, чтобы компоненты вне провайдера не падали в SSR-снапшоте.
    return {
      locale: DEFAULT_LOCALE as Locale,
      setLocale: () => {},
      t: (<K extends keyof Dict["ru"]>(key: K) => dict[DEFAULT_LOCALE][key] ?? String(key)),
    } as LocaleContextValue;
  }
  return ctx;
}

/**
 * tr() — локализуем поле, которое может быть строкой или { ru, en }.
 * Удобно для постепенной миграции mock-данных.
 */
export type Localized<T = string> = T | { ru: T; en: T };

export function tr<T = string>(value: Localized<T>, locale: Locale): T {
  if (value && typeof value === "object" && "ru" in (value as object) && "en" in (value as object)) {
    return (value as { ru: T; en: T })[locale];
  }
  return value as T;
}
