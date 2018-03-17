import { Sale } from "../buse/messages";

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

export function applySale(price: number, sale: Sale) {
  if (sale && sale.rate !== 0) {
    // rate is [0,100], we want [0.0,1.0]
    let floatRate = sale.rate / 100;
    return price * (1 - floatRate);
  }

  return price;
}
