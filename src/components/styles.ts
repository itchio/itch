import { darken, lighten } from "polished";

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
  inputPlaceholder: baseColors.silverChalice,

  inputBorder: uiColors.border,
  inputBorderFocused: uiColors.borderFocused,

  inputTextShadow: uiColors.textShadow,
  inputBoxShadow: uiColors.boxShadow,
  inputBoxShadowFocused: "#1b1919",

  sidebarBackground: darken(0.02, baseColors.codGray),
  sidebarBorder: baseColors.lightMineShaft,
  sidebarEntryFocusedBackground: lighten(0.1, baseColors.codGray),

  dropdownBackground: lighten(0.15, baseColors.codGray),

  secondaryText: lighten(0.1, baseColors.silverChalice),
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

  prefBorder: baseColors.zambezi,
};

export const fontSizes = {
  sidebar: "14px",
  smaller: "14px",
  baseText: "15px",
  modal: "18px",
  large: "16px",
  larger: "18px",
  huge: "20px",
  huger: "26px",
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
} = (styledComponents as any) as ThemedStyledComponentsModule<ITheme>;
// this tiny workaround brought to you by
// this line in the styled-components typings:
// export const ThemeProvider: ThemeProviderComponent<object>;

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
      opacity: 0;
      transform: translateX(-20%);
    }
    100% {
      opacity: 1;
      transform: translateX(0%);
    }
  `,

  fixedEnterTop: keyframes`
    0% {
      opacity: 0;
      transform: translateY(-200px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  `,

  fixedEnterBottom: keyframes`
    0% {
      opacity: 0;
      transform: translateY(200px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  `,

  fixedEnterLeft: keyframes`
    0% {
      opacity: 0;
      transform: translateX(-200px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  `,

  fixedEnterRight: keyframes`
    0% {
      opacity: 0;
      transform: translateX(200px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  `,

  fadeIn: keyframes`
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  `,

  enterBottom: keyframes`
    0% {
      opacity: 0;
      transform: translateY(25%);
    }
    100% {
      opacity: 1;
      transform: translateY(0%);
    }
  `,

  loadBorder: keyframes`
    0% {
      border-image-slice: 0% 0% 10% 92%;
      border-image-width: 0 0 2px 0;
    }
    100% {
      border-image-slice: 0% 0% 10% 0%;
      border-image-width: 0 0 2px 0;
    }
  `,
};

// mixins

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

export const searchInput = () => css`
  border: 2px solid #404040;
  border-radius: 4px 2px 4px 2px;
  background-color: #2D2B2B;
  color: ${props => props.theme.secondaryTextHover};

  ::-webkit-input-placeholder {
    color: ${props => props.theme.inputPlaceholder};
  }

  box-shadow: 0 0 2px #1B1919;
  width: 200px;
  text-indent: 18px;
  padding: 6px 10px 5px 9px;
  height: 32px;
  font-size: 14px;
`;

export const searchIcon = () => css`
  position: absolute;
  left: 10px;
  bottom: 50%;
  transform: translateY(55%);
  font-size: 14px;
  color: ${props => props.theme.secondaryText};
  pointer-events: none;
`;

export const clickable = () => css`
  -webkit-filter: brightness(90%);

  &:hover {
    -webkit-filter: brightness(110%);
    cursor: pointer;
  }

  &:active {
    transform: translateY(1px);
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
    transition: width .51s linear;
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
  min-width: 0;
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
  width: 100%;
`;

export const thumbnailStyle = () => css`
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  border-radius: 2px;
`;

export const hubItemStyle = () => css`
  ${thumbnailStyle()}

  background: #232222;
  border: 1px solid #191919;
  transition: all 0.4s;
`;

export const defaultCoverBackground = () => css`
  background-color: rgba(255, 255, 255, 0.05);
`;

export const accentTextShadow = () => css`
  text-shadow: 1px 1px 1px ${props => props.theme.baseBackground};
`;

export const emptyMeat = () => css`
  margin: 20px;
  color: ${props => props.theme.secondaryText};
  font-size: ${props => props.theme.fontSizes.large};
`;

export const prefChunk = () => css`
  border-left: 3px solid ${props => props.theme.prefBorder};
  transition: 0.2s border ease-in-out;
`;

export const prefChunkActive = () => css`
  border-left: 3px solid ${props => props.theme.accent};
`;
