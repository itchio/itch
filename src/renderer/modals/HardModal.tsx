import React from "react";
import styled from "styled-components";
import { fontSizes } from "renderer/theme";
import { IconButton } from "renderer/basics/IconButton";

const HardModalDiv = styled.div`
  border: 1px solid ${p => p.theme.colors.shellBorder};
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const HardModalTitleDiv = styled.div`
  background: rgba(255, 255, 255, 0.1);

  display: flex;
  flex-direction: row;
  flex-basis: 2em;

  h3 {
    -webkit-app-region: drag;
    padding: 15px;
    font-size: ${fontSizes.normal};
    flex-grow: 1;
  }
`;

const HardModalContent = styled.div`
  padding: 15px;
  overflow-y: auto;
  flex-grow: 1;

  p {
    padding-bottom: 1.2em;
  }
`;

const HardModalButtons = styled.div`
  padding: 15px;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  flex-shrink: 0;
  padding-top: 15px;

  button {
    margin-right: 1em;

    &:last-of-type {
      margin-right: 0;
    }
  }
`;

interface Props {
  title?: React.ReactNode;
  content?: React.ReactNode;
  buttons?: React.ReactNode;
}

export const HardModal = (props: Props) => {
  return (
    <HardModalDiv>
      <HardModalTitleDiv>
        <h3>{props.title}</h3>
        <IconButton icon="cross" onClick={() => window.close()} />
      </HardModalTitleDiv>
      <HardModalContent>{props.content}</HardModalContent>
      <HardModalButtons>{props.buttons}</HardModalButtons>
    </HardModalDiv>
  );
};
