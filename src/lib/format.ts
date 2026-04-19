/**
 * Форматтеры для русского интерфейса. Все числа — tabular-nums.
 */

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
