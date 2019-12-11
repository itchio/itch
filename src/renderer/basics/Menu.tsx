import styled from "styled-components";
import Tippy from "@tippy.js/react";

export const MenuTippy = styled(Tippy)`
  .tippy-content {
    margin: 0;
    padding: 0;

    box-shadow: 0 0 10px #151515;
    border: 1px solid #505050;
  }
`;

export const MenuContents = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  button {
    margin-right: 0 !important;
    justify-content: flex-start;
    background: none;
    border: none;
    text-align: left;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;
