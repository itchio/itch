
import {css, theme} from "../styles";

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
`;
