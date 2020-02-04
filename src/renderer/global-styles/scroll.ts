import { css } from "styled-components";

export default css`
  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background: #aba1a1;
    box-shadow: inset 0 0 2px #deb5b6;
  }

  ::-webkit-scrollbar-track {
    border-radius: 2px;
    /* background: #332e2e; */
    background: transparent;
  }
`;
