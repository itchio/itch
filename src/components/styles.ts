
import {color} from "csx";
import {css, keyframes} from "styled-components";

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
  accent: baseColors.carnation,
  lightAccent: baseColors.vividTangerine,

  error: baseColors.flushMahogany,
  warning: baseColors.mintJulep,
  success: baseColors.gossip,

  buy: baseColors.shamrock,
  sale: baseColors.amber,
  bundle: baseColors.heliotrope,

  explanation: color("#464545"),

  meatBackground: color("#333131"),

  inputBackground: uiColors.background,
  inputPlaceholder: baseColors.zambezi,

  inputBorder: uiColors.border,
  inputBorderFocused: uiColors.borderFocused,

  inputBoxShadow: uiColors.boxShadow,

  sidebarBackground: baseColors.codGray,
  sidebarBorder: baseColors.lightMineShaft,
  sidebarEntryFocusedBackground: baseColors.codGray.lighten("10%"),

  secondaryText: baseColors.silverChalice.darken("10%"),
  secondaryTextHover: baseColors.ivory.lighten("10%"),

  ternaryText: baseColors.zambezi,
};

export const fontSizes = {
  sidebar: "14px",
};

export const borderRadii = {
  explanation: "4px",
};

export const theme = {
  ...colors,
  baseColors,
  uiColors,
  fontSizes,
  borderRadii,
};

export type ITheme = typeof theme;
export interface IThemeProps {
  theme: ITheme;
}

// animations

export const animations = {
  horizontalScan: keyframes`
    0% {
      background-position: 0em 0;
    }
    100% {
      background-position: 1em 0;
    }
  `,

  enterLeft: keyframes`
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(0%);
    }
  `,
};

// styles

export const inkContainer = () => css`
  position: relative;
`;

export const heavyInput = () => css`
  font-size: ${props => props.theme.fontSizes.baseText};
  padding: 12px 10px 9px 10px;
  margin: 8px 4px;

  border: 2px solid ${props => props.theme.inputBorder};
  border-radius: 4px 2px 4px 2px;

  background-color: ${props => props.theme.inputBackground};
  color: ${props => props.theme.inputText};

  text-shadow: 0 0 2px ${props => props.theme.inputTextShadow};
  box-shadow: 0 0 2px ${props => props.theme.inputBoxShadow};

  &::-webkit-input-placeholder {
    text-shadow: 0 0 2px transparent;
    color: ${props => props.theme.inputPlaceholder};
  }

  &:focus {
    border-color: ${props => props.theme.inputBorderFocused};
    box-shadow: 0 0 2px ${props => props.theme.inputBoxShadowFocused};
    outline: 0;
  }
`;

export const iconButton = () => css`
  position: relative;
  border-radius: 50%;
  padding: 5px;
  margin: -2px;

  &:hover {
    color: ${props => props.theme.secondaryTextHover}
  }
`;

export const clickable = () => css`
  -webkit-filter: brightness(90%);

  &:hover {
    -webkit-filter: brightness(110%);
    cursor: pointer;
  }

  &:active {
    transform: translateY(2px);
  }
`;

const downloadProgressColorOut = "rgba(165, 165, 165, 0.47)";
const downloadProgressColorInA = "rgba(255, 255, 255, .1)";
const downloadProgressColorInB = "rgba(255, 255, 255, .4)";

export const progress = () => css`
  position: relative;
  height: 3px;
  width: 100%;

  background: ${downloadProgressColorOut};
  transition: background 1s;

  .progress-inner {
    position: absolute;
    transition: width .3s;
    left: 0;
    top: 0;
    bottom: 0;
    background-color: ${props => props.theme.accent};
    background-image: -webkit-repeating-linear-gradient(
    -60deg,
    ${downloadProgressColorInA} 0,
    ${downloadProgressColorInA} 4px,
    ${downloadProgressColorInB} 4px,
    ${downloadProgressColorInB} 8px);
  }
`;

// mixins

export const horizontalScan = () => css`
  background: -webkit-linear-gradient(
    left,
    ${props => props.theme.secondaryTextHover} 0%
    ${props => props.theme.secondaryTextHover} 50%
    ${props => props.theme.secondaryText} 50%
  );
  background-size: 200% 100%;
  animation: horizontal-scan 2s infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
