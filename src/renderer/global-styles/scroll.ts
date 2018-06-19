import { css } from "renderer/styles";

export default css`
  ::-webkit-scrollbar {
    width: 12px;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 2px;
    background: #aba1a1;
    box-shadow: inset 0 0 2px #deb5b6;
  }

  ::-webkit-scrollbar-track {
    border-radius: 2px;
    background: #443e3e;
    border: 1px solid #484848;
  }
`;
