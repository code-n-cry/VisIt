import { currencySymbol } from "../config/currencies";

export function formatAmount(amount: number, currency: string): string {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = rounded.toLocaleString("ru-RU", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currencySymbol(currency)}`;
}
