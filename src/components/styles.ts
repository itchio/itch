
import {darken, lighten} from "polished";

// colors

export const baseColors = {
  codGray: "#1d1c1c",
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
  background: "#2d2b2b",

  border: "#404040",
  borderFocused: "#676767",

  prefBorder: baseColors.zambezi,

  // FIXME: no pure blacks
  textShadow: "#000000",
  boxShadow: "#1b1919",
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

  explanation: "#464545",

  meatBackground: "#333131",

  baseBackground: baseColors.darkMineShaft,
  baseText: baseColors.ivory,

  inputBackground: uiColors.background,
  inputText: "#d4cece",
  inputPlaceholder: baseColors.zambezi,

  inputBorder: uiColors.border,
  inputBorderFocused: uiColors.borderFocused,

  inputTextShadow: uiColors.textShadow,
  inputBoxShadow: uiColors.boxShadow,
  inputBoxShadowFocused: "#1b1919",

  sidebarBackground: darken(0.02, baseColors.codGray),
  sidebarBorder: baseColors.lightMineShaft,
  sidebarEntryFocusedBackground: lighten(0.1, baseColors.codGray),

  dropdownBackground: lighten(0.15, baseColors.codGray),

  secondaryText: baseColors.silverChalice,
  secondaryTextHover: baseColors.ivory,

  ternaryText: baseColors.zambezi,

  breadBackground: "#292727",
  breadBoxShadow: "#171717",

  filterBackground: "#4a4848",
  filterBorder: "#333",

  filterTagBorder: "#777575",
  filterTagBackground: "#5f5c5c",
  filterTagText: "#e0dfdf",

  tooltipBackground: baseColors.swissCoffee,
  tooltipText: baseColors.codGray,
};

export const fontSizes = {
  sidebar: "14px",
  baseText: "14px",
  large: "16px",
  modal: "18px",
};

export const borderRadii = {
  explanation: "4px",
};

export const widths = {
  searchSidebar: "400px",
  handle: "8px",
  gridItem: "235px",
};

export const theme = {
  ...colors,
  fontSizes,
  borderRadii,
  widths,
};

export type ITheme = typeof theme;
export interface IThemeProps {
  theme: ITheme;
}

import * as styledComponents from "styled-components";
import { ThemedStyledComponentsModule } from "styled-components";
const {
    default: styled,
    css,
    injectGlobal,
    keyframes,
    ThemeProvider,
} = styledComponents as ThemedStyledComponentsModule<ITheme>;

export default styled;
export { css, injectGlobal, keyframes, ThemeProvider };

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

// mixins

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
  ${inkContainer()};
  border-radius: 50%;
  width: 30px;
  height: 30px;

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

export const singleLine = () => css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const secondaryLink = () => css`
  color: ${props => props.theme.secondaryText};
  text-decoration: underline;

  &:hover {
    cursor: pointer;
    color: ${props => props.theme.secondaryTextHover};
  }
`;

export const meat = () => css`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  flex-shrink: 1;
`;

export const thumbnailStyle = () => css`
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  border-radius: 2px;
`;

export const defaultCoverBackground = () => css`
  background-image: linear-gradient(
     -10deg,
     rgba(0, 0, 0, 0.08) 0%,
     rgba(255, 255, 255, 0.05) 100%
  );
`;
