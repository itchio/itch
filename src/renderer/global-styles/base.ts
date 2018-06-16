import { css, theme } from "renderer/styles";
import env from "common/env";

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
    color: ${theme.baseText};
  }

  img.emojione {
    width: 20px;
    margin-bottom: -4px;
  }

  a {
    color: ${theme.accent};

    &[href^="itch:"] {
      color: ${theme.secondaryText};
      text-decoration: none;

      &:hover {
        color: ${theme.baseText};
        cursor: pointer;
      }
    }
  }

  ${testDisables()};
`;
