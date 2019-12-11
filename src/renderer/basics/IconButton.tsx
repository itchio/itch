import classNames from "classnames";
import React from "react";
import { Icon } from "renderer/basics/Icon";
import { fontSizes } from "renderer/theme";
import styled from "styled-components";
import { LoadingCircle, Spinner } from "renderer/basics/LoadingCircle";

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
  loading?: boolean;
  className?: string;
  id?: string;

  onClick?: React.MouseEventHandler<HTMLElement>;
  onMouseDown?: React.MouseEventHandler<HTMLElement>;
  onContextMenu?: React.MouseEventHandler<HTMLElement>;
}

export const IconButton = React.forwardRef(
  (props: Props, ref: React.Ref<HTMLButtonElement>) => {
    const { className, loading, icon, ...restProps } = props;

    return (
      <StyledButton
        ref={ref}
        className={classNames("icon-button", className)}
        {...restProps}
      >
        {loading ? (
          <Spinner />
        ) : typeof icon === "string" ? (
          <Icon icon={icon} />
        ) : (
          icon
        )}
      </StyledButton>
    );
  }
);
