/**
 * Форматтеры. Локалезависимы (RU / EN).
 */

import type { Niche } from "@/types/entities";
import type { Locale } from "@/lib/i18n/locale";

const rubFmt = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const numRu = new Intl.NumberFormat("ru-RU");
const numEn = new Intl.NumberFormat("en-US");

export const formatRub = (value: number) => rubFmt.format(value);

/**
 * Цена с переключением локали. RU оставляет рубли (RU-контекст бизнеса),
 * EN форматирует то же значение под англо-говорящего пользователя
 * (рубли подписью, чтобы не подсовывать конвертированные доллары).
 */
export function formatPrice(valueRub: number, locale: Locale): string {
  if (locale === "en") {
    return `${numEn.format(valueRub)} ₽`;
  }
  return rubFmt.format(valueRub);
}

export const formatNumber = (value: number, locale: Locale = "ru") =>
  (locale === "en" ? numEn : numRu).format(value);

export const formatPercent = (value: number, locale: Locale = "ru") =>
  `${(value * 100).toLocaleString(locale === "en" ? "en-US" : "ru-RU", {
    maximumFractionDigits: 1,
  })}%`;

const nicheLabels: Record<Locale, Record<Niche, string>> = {
  ru: {
    real_estate: "Недвижимость",
    auto: "Авто",
    clinic: "Клиники",
    services: "Услуги",
    online_school: "Онлайн-школы",
    agency: "Агентства",
    other: "Другое",
  },
  en: {
    real_estate: "Real estate",
    auto: "Auto",
    clinic: "Clinics",
    services: "Services",
    online_school: "Online schools",
    agency: "Agencies",
    other: "Other",
  },
};

export const nicheLabel = (n: Niche, locale: Locale = "ru") => nicheLabels[locale][n];

const nicheOptionLabels: Record<Locale, Array<{ value: Niche; label: string }>> = {
  ru: [
    { value: "real_estate", label: "Недвижимость" },
    { value: "auto", label: "Авто и Avito" },
    { value: "clinic", label: "Клиники" },
    { value: "services", label: "Услуги" },
    { value: "online_school", label: "Онлайн-школы" },
    { value: "agency", label: "Агентства" },
    { value: "other", label: "Другое" },
  ],
  en: [
    { value: "real_estate", label: "Real estate" },
    { value: "auto", label: "Auto & Avito" },
    { value: "clinic", label: "Clinics" },
    { value: "services", label: "Services" },
    { value: "online_school", label: "Online schools" },
    { value: "agency", label: "Agencies" },
    { value: "other", label: "Other" },
  ],
};

export const getNicheOptions = (locale: Locale = "ru") => nicheOptionLabels[locale];

// Совместимость со старыми импортами (RU дефолт).
export const nicheOptions = nicheOptionLabels.ru;
