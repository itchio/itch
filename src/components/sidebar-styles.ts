
import {style} from "typestyle";
import * as styles from "./styles";

export const sidebarStyle = style({
  background: styles.colors.sidebarBackground,
  fontSize: styles.fontSizes.sidebar,

  overflow: "hidden",
  height: "100%",
  width: "240px",
  flexGrow: 0,
  flexShrink: 0,

  display: "flex",
  alignItems: "stretch",
  flexDirection: "column",
});

export const titleBarPadderStyle = style({
  flexBasis: "20px",
  flexShrink: 0,
});

export const logoStyle = style({
  textAlign: "center",
  cursor: "pointer",
});

export const logoImgStyle = style({
  width: "120px",
  margin: "10px 0",
});

export const itemContainerStyle = style({
  display: "flex",
  alignItems: "stretch",
  flexDirection: "column",

  overflowX: "hidden",
  overflowY: "auto",
  flexGrow: 1,
});

export const h2Style = style({
  color: styles.colors.ternaryText.toString(),
  padding: "0 7px 0 14px",
  margin: "20px 0 8px 0",
  display: "flex",
  flexShrink: 0,
  alignItems: "center",
});

export const labelStyle = style({
  textTransform: "uppercase",
  fontWeight: "bold",
});

export const fillerStyle = style({
  flexGrow: 1,
});

export const actionStyle = style(
  styles.iconButton,
  styles.clickable,
  styles.inkContainer,
  {
    marginLeft: "6px",
  },
);

export const itemStyle = style(styles.inkContainer, {
  backgroundColor: styles.colors.sidebarBackground.toString(),
  fontSize: styles.fontSizes.sidebar,
  borderRadius: "0 4px 4px 0",
  wordWrap: "break-word",

  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  margin: "2px 0",
  marginRight: 0,
  padding: "5px 8px 5px 10px",
  minHeight: "30px",

  $nest: {
    "&:hover": {
      cursor: "pointer",
      background: styles.colors.sidebarEntryFocusedBackgroundColor.darken("5%").toString(),
      color: styles.baseColors.ivory.toString(),
    },
  },
});

export const freshItemStyle = style({
  animationName: styles.animations.enterLeft,
  animationDuration: ".3s",
  animationTimingFunction: "ease-out",
});

export const activeItemStyle = style({
  background: styles.colors.sidebarEntryFocusedBackgroundColor.toString(),
});

export const userMenuStyle = style({
  marginRight: 0,
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "16px 8px",

  $nest: {
    // is that a thing?
    "*": {
      flexGrow: 0,
    },
    ".icon": {
      margin: 0,
    },
    "img": {
      height: "2em",
      width: "2em",
      margin: "0 5px",
      borderRadius: "2px",
    },
  },
});

export const searchStyle = style({
  padding: "0 8px",
  margin: "8px 4px",
});

export const searchInputStyle = style(styles.inkContainer, styles.heavyInput, {
  transition: "all 0.2s",
  width: "100%",
  textIndent: "14px",
  padding: "6px 10px 5px 9px",
  height: "32px",
  fontSize: styles.fontSizes.sidebar,
});

export const searchIconStyle = style({
  position: "absolute",
  left: "20px",
  bottom: "50%",
  transform: "translateY(55%)",
  fontSize: styles.fontSizes.sidebar,
  // color: styles.colors.inputPlaceholderColor.toString(),
  pointerEvents: "none",
});

export const loadingSearchIconStyle = style(styles.horizontalScanMixin());
