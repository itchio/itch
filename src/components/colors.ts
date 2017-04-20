
import {color} from "csx";

export const baseColors = {
  codGray: color("#1d1c1c"),
  darkMineShaft: color("#2e2b2c"),
  lightMineShaft: color("#383434"),
  zambezi: color("#5d5757"),
  silverChalice: color("#a0a0a0"),
  swissCoffee: color("#dad2d2"),
  ivory: color("#fffff0"),

  flushMahogany: color("#d14343"),
  mintJulep: color("#efeebf"),
  gossip: color("#b9e8a1"),

  shamrock: color("#24c091"),
  amber: color("#ffc200"),
  heliotrope: color("#c17dff"),

  carnation: color("#fa5c5c"),
  vividTangerine: color("#ff8080"),
};

export const uiColors = {
  background: color("#2d2b2b"),

  border: color("#404040"),
  borderFocused: color("#676767"),

  prefBorder: baseColors.zambezi,

  // FIXME: no pure blacks
  textShadow: color("#000000"),
  boxShadow: color("#1b1919"),
};

export const colors = {
  inputBackground: uiColors.background,
  inputPlaceholder: baseColors.zambezi,

  inputBorder: uiColors.border,
  inputBorderFocused: uiColors.borderFocused,

  sidebarBackground: baseColors.codGray,
  sidebarEntryFocusedBackgroundColor: baseColors.codGray.lighten("10%"),

  secondaryText: baseColors.silverChalice.darken("10%"),
  secondaryTextHover: baseColors.ivory.lighten("10%"),

  ternaryText: baseColors.zambezi,
};
