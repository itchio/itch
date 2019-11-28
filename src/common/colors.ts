import { lighten } from "polished";

export const baseColors = {
  codGray: "#151515",
  darkMineShaft: "#2e2b2c",
  lightMineShaft: "#383434",
  zambezi: "#5d5757",
  silverChalice: "#a0a0a0",
  swissCoffee: "#dad2d2",
  ivory: "#fffff0",

  flushMahogany: "#d14343",
  mintJulep: "#efeebf",
  gossip: "#b9e8a1",

  shamrock: "#24c091",
  amber: "#ffc200",
  heliotrope: "#c17dff",

  carnation: "#fa5c5c",
  vividTangerine: "#ff8080",
};

export const uiColors = {
  background: "#1d1d1d",

  border: "#404040",
  borderFocused: "#676767",

  boxShadow: "#1b1919",
};

const breadBackground = `#141414`;
const itemBackground = "#1e1e1e";

export const colors = {
  accent: baseColors.carnation,
  lightAccent: baseColors.vividTangerine,

  error: baseColors.flushMahogany,
  warning: baseColors.mintJulep,
  success: baseColors.gossip,

  buy: baseColors.shamrock,
  sale: "#34a0f2",
  bundle: baseColors.heliotrope,

  explanation: itemBackground,

  meatBackground: breadBackground,
  itemBackground,

  baseBackground: baseColors.codGray,
  baseText: baseColors.ivory,

  inputBackground: uiColors.background,
  inputFocusedBackground: lighten(0.1, uiColors.background),
  inputSelectedBackground: lighten(0.2, uiColors.background),
  inputText: "#d4cece",
  inputPlaceholder: baseColors.silverChalice,

  inputBorder: uiColors.border,
  inputBorderFocused: uiColors.borderFocused,

  inputBoxShadow: uiColors.boxShadow,
  inputBoxShadowFocused: "#1b1919",

  sidebarBackground: breadBackground,
  sidebarBorder: lighten(0.03, breadBackground),
  sidebarEntryFocusedBackground: lighten(0.05, breadBackground),

  dropdownBackground: lighten(0.15, baseColors.codGray),

  secondaryText: lighten(0.1, baseColors.silverChalice),
  secondaryTextHover: baseColors.ivory,

  ternaryText: baseColors.zambezi,

  breadBackground,
  breadBoxShadow: "#171717",

  filterBackground: "#4a4848",
  filterBorder: "#333",

  filterTagBorder: "#777575",
  filterTagBackground: "#5f5c5c",
  filterTagText: "#e0dfdf",

  tooltipBackground: baseColors.swissCoffee,
  tooltipText: baseColors.codGray,

  prefBorder: baseColors.zambezi,

  priceNormal: "#70f1c9",
  priceSale: "#ffd700",

  windowBorder: baseColors.lightMineShaft,
};
