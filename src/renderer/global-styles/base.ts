import { css, theme } from "renderer/styles";

export default css`
  * {
    box-sizing: border-box;
  }

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

  img {
    user-drag: none;
  }

  code {
    font-family: monospace;
  }

  a {
    color: ${theme.accent};

    &[href^="itch:"] {
      /* color: ${theme.baseText};
      text-decoration: none; */

      &:hover {
        cursor: pointer;
      }

      &:active {
        transform: translateY(1px);
      }
    }
  }
`;
