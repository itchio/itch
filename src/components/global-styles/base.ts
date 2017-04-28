
import {css} from "../styles";

export default css`
  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    overflow: hidden;
    -webkit-user-select: none;
    box-sizing: border-box;
  }

  body {
    font-size: $base-text-size;
    color: $base-text-color;
  }

  body, input {
    font-family: LatoWeb, sans-serif;
  }

  *, *:before, *:after {
    box-sizing: inherit;
  }
`;
