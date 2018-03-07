import styled, * as styles from "../styles";

export const ModalWidgetDiv = styled.div`
  padding: 10px 20px;
  flex-grow: 1;
  overflow-y: auto;

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
`;
