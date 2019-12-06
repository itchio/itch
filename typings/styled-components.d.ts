// import original module declarations
import "styled-components";

// and extend them!
declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      /** Main background color */
      shellBg: string;
      /** Main window border */
      shellBorder: string;

      /** Primary text */
      text1: string;
      /** Secondary text */
      text2: string;
      /** Ternary text */
      text3: string;

      /** Error block background */
      errorBg: string;
      /** Error block text */
      errorText: string;

      /** Link color, loading spinner color, etc. */
      accent: string;

      /** Primary button background */
      button1Bg: string;
      /** Primary button text */
      button1Text: string;
      /** Primary button border */
      button1Border: string;
      /** Primary button background (on hover) */
      button1BgHover: string;
      /** Primary button background (on active) */
      button1BgActive: string;

      /** Secondary button background */
      button2Bg: string;
      /** Secondary button text */
      button2Text: string;
      /** Secondary button border */
      button2Border: string;
      /** Secondary button background (on hover) */
      button2BgHover: string;
      /** Secondary button background (on active) */
      button2BgActive: string;

      /** Input field background */
      inputBg: string;
      /** Input field text */
      inputText: string;
      /** Input field border */
      inputBorder: string;
      /** Input field border (on focus) */
      inputBorderFocus: string;
    };
  }
}
