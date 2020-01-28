import styled from "styled-components";
import Tippy from "@tippy.js/react";

export const MenuTippy = styled(Tippy)`
  & > .tippy-content {
    margin: 0;
    padding: 0;

    box-shadow: 0 0 10px #151515;
  }
`;

export const MenuContents = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  button:not(.icon-button):not(.real-button) {
    flex-shrink: 0;
    margin-right: 0 !important;
    justify-content: flex-start;
    background: none;
    border: none;
    text-align: left;

    .button-label {
      width: 100%;
    }

    &:hover,
    &:focus {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .button-group {
    padding: 8px;
    align-self: auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;

    .button {
      margin-right: 1em;

      &:last-child {
        margin-right: 0;
      }
    }
  }
`;
