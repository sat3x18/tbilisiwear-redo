// Currency formatting utility that uses store settings

const CURRENCY_MAP: Record<string, { code: string; locale: string }> = {
  EUR: { code: "EUR", locale: "de-DE" },
  USD: { code: "USD", locale: "en-US" },
  GBP: { code: "GBP", locale: "en-GB" },
  GEL: { code: "GEL", locale: "ka-GE" },
};

export function formatPrice(amount: number, currency: string = "EUR"): string {
  const currencyInfo = CURRENCY_MAP[currency] || CURRENCY_MAP.EUR;
  
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: "currency",
    currency: currencyInfo.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrencySymbol(currency: string = "EUR"): string {
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    GEL: "₾",
  };
  return symbols[currency] || "€";
}
