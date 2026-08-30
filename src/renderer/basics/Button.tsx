import classNames from "classnames";
import { LocalizedString } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import styled, * as styles from "renderer/styles";

const Label = styled.div`
  ${styles.singleLine};
`;

const ButtonStyled = styled.button`
  ${styles.resetButton};
  ${styles.singleLine};
  transition: all 0.2s;

  font-size: ${(props) => props.theme.fontSizes.baseText};
  font-weight: bold;
  padding: 4px 10px;

  border: 1px solid;
  ${styles.squircle("16px")};

  ${styles.secondaryButtonSurface};

  box-shadow: 0 1px 3px ${(props) => props.theme.inputBoxShadow};
  text-shadow: 0px 1px rgba(0, 0, 0, 0.4);

  min-height: 38px;
  min-width: 7em;

  &:hover:not(:disabled) {
    cursor: pointer;
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &.primary {
    color: ${(props) => props.theme.baseText};
    background-image: linear-gradient(
      10deg,
      hsla(355, 50%, 32%, 1),
      hsla(355, 50%, 48%, 1)
    );
    border-color: hsla(355, 40%, 52%, 1);

    &:hover:not(:disabled) {
      box-shadow: 0 0 8px ${(props) => props.theme.inputBoxShadow};
      border-color: hsla(355, 45%, 62%, 1);
    }
  }

  &.fat {
    font-size: ${(props) => props.theme.fontSizes.huge};
    padding: 16px 80px;
  }

  &.wide {
    min-width: 160px;
    justify-content: center;
    font-size: ${(props) => props.theme.fontSizes.large};
    padding-top: 14px;
    padding-bottom: 14px;
    padding-left: 20px;
    padding-right: 20px;
  }

  &:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }

  &.translucent {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
  }

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &.wide {
    gap: 12px;
  }
`;

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  primary?: boolean;
  hint?: LocalizedString;
  icon?: string;
  iconComponent?: JSX.Element;
  label?: JSX.Element | string;
  wide?: boolean;
  fat?: boolean;
  disabled?: boolean;
  id?: string;
  translucent?: boolean;
  type?: "button" | "submit" | "reset";
  children?: React.ReactNode;
}

const Button = ({
  className,
  primary,
  fat,
  icon,
  iconComponent,
  label,
  hint,
  wide,
  disabled,
  translucent,
  onClick,
  type = "button",
  children,
  ...restProps
}: Props) => {
  return (
    <ButtonStyled
      type={type}
      disabled={disabled}
      onClick={onClick}
      data-rh={hint ? JSON.stringify(hint) : null}
      data-rh-at="top"
      className={classNames(className, {
        primary,
        wide,
        fat,
        translucent,
      })}
      {...restProps}
    >
      {iconComponent ? iconComponent : icon ? <Icon icon={icon} /> : null}
      {label ? <Label>{label}</Label> : null}
      {children}
    </ButtonStyled>
  );
};

export default React.memo(Button);
