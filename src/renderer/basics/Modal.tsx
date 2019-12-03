import React from "react";
import { IconButton } from "renderer/basics/IconButton";
import { JSXChild, JSXChildren } from "renderer/basics/jsx-types";
import styled, { animations } from "renderer/styles";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import classNames from "classnames";

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

  animation: ${animations.fadeIn} ease-out 0.2s;

  z-index: 10;
`;

const ModalContents = styled.div`
  background: ${props => props.theme.meatBackground};
  border: 1px solid ${props => props.theme.windowBorder};

  min-width: 400px;

  pointer-events: initial;

  p {
    margin: 1.4em 0;
  }
`;

const ModalTitle = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  background: ${props => props.theme.baseBackground};
  font-size: ${props => props.theme.fontSizes.larger};
  font-weight: bold;

  &.present {
    padding: 15px;
    border-bottom: 1px solid ${props => props.theme.filterBorder};
    margin-bottom: 10px;
  }
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
  title?: JSXChild;
  children?: JSXChildren;
  onClose?: () => void;
}) => {
  const { title, children, onClose } = props;

  return (
    <ModalShroud>
      <ModalContents>
        <ModalTitle
          className={classNames({ present: !!props.title || !!props.onClose })}
        >
          {title}
          <Filler />
          {onClose ? (
            <IconButton icon="cross" onClick={() => onClose()}></IconButton>
          ) : null}
        </ModalTitle>
        <ModalBody>{children}</ModalBody>
      </ModalContents>
    </ModalShroud>
  );
};

// TODO: dedup with Gate/Form.tsx
const Buttons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-self: stretch;

  button {
    margin-right: 1em;

    &:last-of-type {
      margin-right: 0;
    }
  }
`;

export const ConfirmModal = (props: {
  question: JSXChild;
  cancelLabel?: JSXChild;
  onCancel: (...args: any[]) => void;

  confirmLabel?: JSXChild;
  onConfirm: (...args: any[]) => void;
}) => {
  const { question, cancelLabel, onCancel, confirmLabel, onConfirm } = props;

  return (
    <Modal>
      <p>{question}</p>
      <Buttons>
        <Button
          secondary
          label={
            cancelLabel ? (
              cancelLabel
            ) : (
              <FormattedMessage id="prompt.action.cancel" />
            )
          }
          onClick={onCancel}
        />
        <Button
          label={
            confirmLabel ? (
              confirmLabel
            ) : (
              <FormattedMessage id="prompt.action.ok" />
            )
          }
          onClick={onConfirm}
        />
      </Buttons>
    </Modal>
  );
};
