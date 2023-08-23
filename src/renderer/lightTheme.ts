import { lighten } from "polished";

export const baseColors = {
  codGray: "#f7f7f7",
  darkMineShaft: "#d9d9d9",
  lightMineShaft: "#e9e9e9",
  zambezi: "#4e4545",
  silverChalice: "#161616",
  swissCoffee: "#746d6d",
  ivory: "#272929",

  flushMahogany: "#f97b7b",
  mintJulep: "#c1c252",
  gossip: "#74a46c",

  shamrock: "#13916d",
  amber: "#ffc200",
  heliotrope: "#7c409a",

  carnation: "#bb2525",
  vividTangerine: "#cc4b4a",
};

export const uiColors = {
  background: "#a5a5a5",

  border: "#8b8d8d",
  borderFocused: "#c5c5c6",

  // FIXME: no pure blacks
  textShadow: "#b9b9ba",
  boxShadow: "#989898",
};

const breadBackground = `#f4f4f4`;
const itemBackground = "#eedbdb";

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
  inputText: "#3e3f3f",
  inputPlaceholder: baseColors.silverChalice,

  inputBorder: uiColors.border,
  inputBorderFocused: uiColors.borderFocused,

  inputTextShadow: uiColors.textShadow,
  inputBoxShadow: uiColors.boxShadow,
  inputBoxShadowFocused: "#1b1919",

  sidebarBackground: "#e9e9e9",

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

export const fontSizes = {
  small: "12px",
  sidebar: "14px",
  smaller: "14px",
  baseText: "15px",
  modal: "18px",
  large: "16px",
  larger: "18px",
  huge: "19px",
  huger: "23px",
  enormous: "30px",
};

export const borderRadii = {
  explanation: "4px",
};

export const widths = {
  searchSidebar: "500px",
  handle: "8px",
  gridItem: "235px",
};

export const lightTheme = {
  ...colors,
  baseColors,
  fontSizes,
  borderRadii,
  widths,
};
