import { IModal } from "../../types";

import styled, * as styles from "../styles";
import { actions } from "../../actions/index";

export interface IModalWidgetProps {
  modal: IModal;
  updatePayload: (payload: typeof actions.modalResponse.payload) => void;
}

export const ModalWidgetDiv = styled.div`
  padding: 10px 20px;
  flex-grow: 1;

  input[type="number"],
  input[type="text"],
  input[type="password"] {
    ${styles.heavyInput()};
    width: 100%;
  }

  input[type="number"] {
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  strong {
    font-weight: bold;
  }

  p {
    line-height: 1.4;
    margin: 8px 0;
  }

  .json-tree-container {
    width: 100%;
    height: 350px;
    overflow-y: auto;
  }

  .prereqs-rows {
    display: flex;
    flex: 0 1;
    flex-direction: column;
    align-content: flex-start;
  }

  .prereqs-row {
    display: flex;
    flex: 0 1;
    flex-direction: row;
    align-items: center;
    margin: 14px 0;
    margin-left: 10px;

    .task-status {
      margin-top: 5px;
      font-size: 80%;
      color: ${props => props.theme.secondaryText};
    }
  }

  .clear-browsing-data-list {
    label {
      display: block;
      border-left: 3px solid ${props => props.theme.prefBorder};
      padding: 5px 0;
      padding-left: 5px;
      margin: 3px 0;
      margin-bottom: 10px;
      transition: 0.2s border ease-in-out;

      &:hover {
        cursor: pointer;
      }

      &.active {
        border-color: ${props => props.theme.accent};
      }
    }

    .checkbox {
      margin: 0;
      display: flex;
      align-items: center;

      input[type="checkbox"] {
        margin-right: 10px;
      }
    }

    .checkbox-info {
      margin: 0;
      margin-top: 5px;
      margin-left: 5px;
      font-size: 90%;
      color: ${props => props.theme.secondaryText};
    }
  }
`;
