
import {css, theme} from "../styles";
import env from "../../env";

const hideInk = () => {
  if (env.name !== "test") {
    return css``;
  }

  return css`
    canvas.ink {
      display: none !important;
    }
  `;
};

export default css`
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    -webkit-user-select: none;

    font-family: LatoWeb, sans-serif;
    color: ${theme.baseText};
  }

  ${hideInk()} 
`;
