export function formatPrice(currency: string, value: number) {
  if (currency === "CAD") {
    return `CAD $${(value / 100).toFixed(2)}`;
  } else if (currency === "AUD") {
    return `AUD $${(value / 100).toFixed(2)}`;
  } else if (currency === "GBP") {
    return `£${(value / 100).toFixed(2)}`;
  } else if (currency === "JPY") {
    return `¥${value.toFixed(2)}`;
  } else if (currency === "EUR") {
    return `${(value / 100).toFixed(2)} €`;
  } else {
    // default to dollarydoos
    return `$${(value / 100).toFixed(2)}`;
  }
}
