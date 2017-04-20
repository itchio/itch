
import {keyframes, types} from "typestyle";
import {color} from "csx";

// colors

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

export const fontSizes = {
  sidebar: "14px",
};

// animations

export const animations = {
  horizontalScan: keyframes({
    "0%": {
      backgroundPosition: "0em 0",
    },
    "100%": {
      backgroundPosition: "1em 0",
    },
  }),

  enterLeft: keyframes({
    "0%": {
      transform: "translateX(-100%)",
    },
    "100%": {
      transform: "translateX(0%)",
    },
  }),
};

// styles

export const inkContainer = <types.NestedCSSProperties> {
  position: "relative",
};

export const heavyInput = <types.NestedCSSProperties> {
  // fontSize: fontSizes.baseText,
  // padding: "12px 10px 9px 10px",
  // margin: "8px 4px",

  // border: `2px solid ${colors.inputBorder}`,
  // borderRadius: "4px 2px 4px 2px",

  // backgroundColor: colors.inputBackground,
  // color: colors.inputText,

  // textShadow: `0 0 2px ${colors.inputTextShadow}`,
  // boxShadow: `0 0 2px ${colors.inputBoxShadow}`,

  // $nest: {
  //   "&::-webkit-input-placeholder": {
  //     textShadow: `0 0 2px transparent`,
  //     color: colors.inputPlaceholder.toString(),
  //   },
  //   "&:focus": {
  //     borderColor: colors.inputFocusedBorder,
  //     boxShadow: colors.,
  //   },
  // },
};

export const iconButton = <types.NestedCSSProperties> {
  position: "relative",
  borderRadius: "50%",
  padding: "5px",
  margin: "-2px",
  $nest: {
    "&:hover": {
      // color: colors.secondaryTextHover.toString(),
    },
  },
};

export const clickable = <types.NestedCSSProperties> {
  filter: "brightness(90%)",
  $nest: {
    "&:hover": {
      filter: "brightness(110%)",
      cursor: "pointer",
    },
    "&:active": {
      transform: "translateY(2px)",
    },
  },
};

// mixins

export const horizontalScanMixin = (
    dark = colors.secondaryText,
    light = colors.secondaryTextHover): types.NestedCSSProperties => ({
  background: `-webkit-linear-gradient(
    left,
    ${light} 0%,
    ${light} 50%,
    ${dark} 50%,
  )`,
  backgroundSize: "200% 100%",
  animationName: animations.horizontalScan,
  animationDuration: "2s",
  animationIterationCount: "infinite",
  backgroundClip: "text",
  "-webkit-text-fill-color": "transparent",
});
