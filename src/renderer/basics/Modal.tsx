import React from "react";
import styled, { animations } from "renderer/styles";
import { IconButton } from "renderer/basics/IconButton";

const ModalShroud = styled.div`
  position: fixed;
  padding: 20px;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  background: rgba(0, 0, 0, 0.8);

  display: flex;
  align-items: center;
  justify-content: center;

  animation: ${animations.fadeIn} 0.4s;

  z-index: 10;
`;

const ModalContents = styled.div`
  background: ${props => props.theme.meatBackground};
  border: 1px solid ${props => props.theme.windowBorder};

  min-width: 400px;
  min-height: 300px;

  pointer-events: initial;
`;

const ModalTitle = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 15px;

  background: ${props => props.theme.baseBackground};
  font-size: ${props => props.theme.fontSizes.larger};
  font-weight: bold;

  border-bottom: 1px solid ${props => props.theme.filterBorder};
  margin-bottom: 10px;
`;

const ModalBody = styled.div`
  padding: 15px;

  max-width: 80vw;
  max-height: 70vh;

  overflow: auto;
`;

const Filler = styled.div`
  flex-grow: 1;
`;

export const Modal = (props: {
  title?: string | JSX.Element;
  children?: (JSX.Element | string)[] | JSX.Element | string;
  onClose: () => void;
}) => {
  const { title, children, onClose } = props;

  return (
    <ModalShroud>
      <ModalContents>
        <ModalTitle>
          {title}
          <Filler />
          <IconButton icon="cross" onClick={() => onClose()}></IconButton>
        </ModalTitle>
        <ModalBody>{children}</ModalBody>
      </ModalContents>
    </ModalShroud>
  );
};
