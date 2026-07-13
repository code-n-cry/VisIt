export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

/**
 * Currencies offered in pickers. Codes must be ISO 4217 — they are sent
 * as-is to the exchange rate API. Add/remove entries freely.
 */
export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "Доллар США" },
  { code: "EUR", symbol: "€", name: "Евро" },
  { code: "RUB", symbol: "₽", name: "Российский рубль" },
  { code: "CNY", symbol: "¥", name: "Юань" },
  { code: "GBP", symbol: "£", name: "Фунт стерлингов" },
  { code: "JPY", symbol: "¥", name: "Иена" },
  { code: "KZT", symbol: "₸", name: "Тенге" },
  { code: "GEL", symbol: "₾", name: "Лари" },
  { code: "TRY", symbol: "₺", name: "Турецкая лира" },
  { code: "AED", symbol: "د.إ", name: "Дирхам ОАЭ" },
  { code: "AMD", symbol: "֏", name: "Драм" },
  { code: "THB", symbol: "฿", name: "Бат" },
];

export const DEFAULT_CURRENCY = "USD";

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
