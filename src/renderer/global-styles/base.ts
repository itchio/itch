import { css, theme } from "renderer/styles";
import { lightTheme } from "renderer/lightTheme";
import env from "renderer/env";

const currentTheme = global.ReduxStore.getState().preferences.lightMode
  ? lightTheme
  : theme;

const testDisables = () => {
  if (!env.integrationTests) {
    return css``;
  }

  return css`
    * {
      transition-property: none !important;
      -o-transition-property: none !important;
      -moz-transition-property: none !important;
      -ms-transition-property: none !important;
      -webkit-transition-property: none !important;

      animation: none !important;
      -o-animation: none !important;
      -moz-animation: none !important;
      -ms-animation: none !important;
      -webkit-animation: none !important;
    }
  `;
};

export default css`
  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    user-select: none;

    font-family: LatoWeb, sans-serif;
    color: ${currentTheme.baseText};
  }

  img.emojione {
    width: 20px;
    margin-bottom: -4px;
  }

  img {
    user-drag: none;
  }

  a {
    color: ${currentTheme.accent};

    &[href^="itch:"] {
      color: ${currentTheme.baseText};
      text-decoration: none;

      &:hover {
        cursor: pointer;
      }

      &:active {
        transform: translateY(1px);
      }
    }
  }

  ${testDisables()};
`;
