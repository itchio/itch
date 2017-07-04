import { css } from "../styles";

export default css`
  ::-webkit-scrollbar {
    width: 16px;
  }

  ::-webkit-scrollbar-track {
    background: #4b4a4a;
    border-radius: 1px;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 1px;
    background: #fa5c5c;
    -webkit-box-shadow: inset 0 0 2px #FF8081;
  }
`;
