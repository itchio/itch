import { css } from "styled-components";

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

    color: ${p => p.theme.colors.text1};
  }

  html,
  body,
  button {
    font-family: LatoWeb, sans-serif;
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
    color: ${p => p.theme.colors.accent};

    &[href^="itch:"] {
      &:hover {
        cursor: pointer;
      }

      &:active {
        transform: translateY(1px);
      }
    }
  }
`;
