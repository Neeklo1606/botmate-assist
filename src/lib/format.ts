/**
 * Форматтеры для русского интерфейса. Все числа — tabular-nums.
 */

import type { Niche } from "@/types/entities";

const rub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("ru-RU");

export const formatRub = (value: number) => rub.format(value);
export const formatNumber = (value: number) => num.format(value);
export const formatPercent = (value: number) =>
  `${(value * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;

export const nicheLabel: Record<Niche, string> = {
  real_estate: "Недвижимость",
  auto: "Авто",
  clinic: "Клиники",
  services: "Услуги",
  online_school: "Онлайн-школы",
  agency: "Агентства",
  other: "Другое",
};

export const nicheOptions: Array<{ value: Niche; label: string }> = [
  { value: "real_estate", label: "Недвижимость" },
  { value: "auto", label: "Авто и Avito" },
  { value: "clinic", label: "Клиники" },
  { value: "services", label: "Услуги" },
  { value: "online_school", label: "Онлайн-школы" },
  { value: "agency", label: "Агентства" },
  { value: "other", label: "Другое" },
];
