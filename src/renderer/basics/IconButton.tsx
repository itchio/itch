import classNames from "classnames";
import React from "react";
import { Icon } from "renderer/basics/Icon";
import { fontSizes } from "renderer/theme";
import styled from "styled-components";

const StyledButton = styled.button`
  &:not(.disabled) {
    cursor: pointer;
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }

    &:active {
      opacity: 0.8;
    }
  }

  background: none;
  border: none;
  color: inherit;

  font-size: ${fontSizes.large};
  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  width: 45px;
  height: 45px;

  &:focus {
    outline: none;
  }

  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

interface Props {
  icon: string | JSX.Element;
  disabled?: boolean;
  className?: string;
  id?: string;

  onClick?: React.MouseEventHandler<HTMLElement>;
  onMouseDown?: React.MouseEventHandler<HTMLElement>;
  onContextMenu?: React.MouseEventHandler<HTMLElement>;
}

export const IconButton = (props: Props) => {
  const { className, icon, ...restProps } = props;

  return (
    <StyledButton
      className={classNames("icon-button", className)}
      {...restProps}
    >
      {typeof icon === "string" ? <Icon icon={icon} /> : icon}
    </StyledButton>
  );
};
