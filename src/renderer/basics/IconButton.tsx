import classNames from "classnames";
import { LocalizedString } from "common/types";
import React from "react";
import { useIntl } from "react-intl";
import styled, * as styles from "renderer/styles";
import Icon from "renderer/basics/Icon";
import { TString } from "renderer/t";

const IconButtonStyled = styled.button`
  ${styles.resetButton};

  &:not(.disabled) {
    ${styles.clickable};
  }

  font-size: ${(props) => props.theme.fontSizes.baseText};
  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  width: 30px;
  height: 30px;

  &:hover {
    color: ${(props) => props.theme.secondaryTextHover};
  }

  &.disabled {
    opacity: 0.2;
    pointer: disabled;
  }

  &.emphasized {
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &.big {
    font-size: ${(props) => props.theme.fontSizes.huge};
    width: 36px;
    height: 36px;
  }

  &.huge {
    font-size: ${(props) => props.theme.fontSizes.huger};
    width: 48px;
    height: 48px;
  }

  &.enormous {
    font-size: ${(props) => props.theme.fontSizes.enormous};
    width: 48px;
    height: 48px;
  }
`;

interface Props {
  icon: string | JSX.Element;
  disabled?: boolean;
  className?: string;
  id?: string;
  title?: string;
  hint?: LocalizedString;
  hintPosition?: "top" | "left" | "right" | "bottom";

  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
  onContextMenu?: React.MouseEventHandler<HTMLButtonElement>;
  big?: boolean;
  huge?: boolean;
  enormous?: boolean;
  emphasized?: boolean;
}

const IconButton = ({
  className,
  big,
  huge,
  enormous,
  emphasized,
  disabled,
  icon,
  hint,
  hintPosition = "top",
  ...restProps
}: Props) => {
  const intl = useIntl();
  const ariaLabel = hint ? TString(intl, hint) : restProps.title;

  return (
    <IconButtonStyled
      type="button"
      className={classNames(className, {
        disabled,
        big,
        huge,
        enormous,
        emphasized,
      })}
      data-rh={hint ? JSON.stringify(hint) : null}
      data-rh-at={hintPosition}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      {...restProps}
    >
      {typeof icon === "string" ? <Icon icon={icon} /> : icon}
    </IconButtonStyled>
  );
};

export default React.memo(IconButton);
