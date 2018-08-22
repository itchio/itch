import styled from "renderer/styles";

export const ModalButtons = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  & > * {
    margin-left: 1em;
  }
`;
