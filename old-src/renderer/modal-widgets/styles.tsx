import styled, * as styles from "renderer/styles";

export const ModalWidgetDiv = styled.div`
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;

  input[type="number"],
  input[type="text"],
  input[type="password"] {
    ${styles.heavyInput};
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
`;
