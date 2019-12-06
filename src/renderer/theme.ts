import { DefaultTheme, keyframes, css } from "styled-components";
import { lighten, darken } from "polished";

export const fontSizes = {
  small: "12px",
  normal: "15px",
  large: "18px",
  enormous: "30px",
};

export const shellBgDefault = "#151515";

export const theme: DefaultTheme = {
  colors: {
    shellBg: shellBgDefault,
    shellBorder: "#323232",

    text1: "#fafafa",
    text2: "#a8a8a8",
    text3: "#818181",

    errorBg: "#f2ee77",
    errorText: "#fafafa",

    button1Bg: "#a83737",
    button1BgHover: lighten(0.1, "#a83737"),
    button1BgActive: darken(0.1, "#a83737"),
    button1Border: "transparent",
    button1Text: "#fafafa",

    button2Bg: "transparent",
    button2BgHover: "rgba(255, 255, 255, .2)",
    button2BgActive: "rgba(255, 255, 255, .1)",
    button2Border: "#818181",
    button2Text: "#a8a8a8",

    inputBg: "#1d1d1d",
    inputText: "#a8a8a8",
    inputBorder: "#404040",
    inputBorderFocus: "#494949",

    accent: "#d14343",
  },
};

// animations

export const animations = {
  horizontalIndeterminate: keyframes`
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(300%);
    }
  `,

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

  enterTop: keyframes`
    0% {
      opacity: 0;
      transform: translateY(-25%);
    }
    100% {
      opacity: 1;
      transform: translateY(0%);
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

  lineSpinner: keyframes`
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  `,

  spinner: keyframes`
    0% {
      transform: rotateX(0);
    }

    100% {
      transform: rotateX(360deg);
    }
  `,
};

// mixins

export const mixins = {
  singleLine: css`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  `,
};
