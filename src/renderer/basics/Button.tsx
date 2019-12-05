import classNames from "classnames";
import { LocalizedString } from "common/types";
import { darken, lighten } from "polished";
import React from "react";
import { Icon } from "renderer/basics/Icon";
import { JSXChild } from "renderer/basics/jsx-types";
import * as styles from "renderer/styles";
import styled, { css } from "renderer/styles";
import { LoadingCircle } from "renderer/basics/LoadingCircle";

const Label = styled.div`
  ${styles.singleLine};
  text-shadow: 0px 1px rgba(0, 0, 0, 0.4);

  &.loading {
    /* this way we keep the width of the button */
    visibility: hidden;
  }
`;

const buttonColors = (bg: string) => {
  return css`
    background-color: ${bg};

    &:hover {
      background-color: ${lighten(0.1, bg)};
    }

    &:focus {
      outline: none;
    }

    &:active {
      background-color: ${darken(0.05, bg)};
    }
  `;
};

const Container = styled.button`
  position: relative;

  ${styles.singleLine};
  transition: ease-out 0.1s;

  font-size: ${props => props.theme.fontSizes.baseText};
  font-weight: normal;
  padding: 12px 16px;

  border: 1px solid transparent;
  border-radius: 2px;

  color: ${props => props.theme.baseText};
  min-height: 38px;
  min-width: 7em;

  cursor: pointer;

  ${buttonColors("#a83737")}

  &.secondary {
    background: none;
    border: 1px solid #555;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #5a5a5a;
    }

    &:active {
      border: 1px solid #5f5f5f;
    }
  }

  &.primary {
    font-weight: bold;
  }

  &.big {
    font-size: ${props => props.theme.fontSizes.huge};
    font-weight: bold;
    padding: 16px 80px;
  }

  &.wide {
    min-width: 160px;
    justify-content: center;
    font-size: ${props => props.theme.fontSizes.large};
    padding-top: 16px;
    padding-bottom: 12px;
    padding-left: 20px;
    padding-right: 20px;
    font-weight: normal;
  }

  &.disabled {
    opacity: 0.7;
    &:hover {
      cursor: not-allowed;
    }
  }

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Spacer = styled.div`
  min-width: 0.8em;
  flex-shrink: 0;
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;

  display: flex;
  justify-content: center;
  align-items: center;
`;

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  primary?: boolean;
  hint?: LocalizedString;
  icon?: string;
  iconComponent?: JSX.Element;
  label?: JSXChild;
  wide?: boolean;
  big?: boolean;
  disabled?: boolean;
  loading?: boolean;
  id?: string;
  translucent?: boolean;
  secondary?: boolean;
}

export const Button = (props: Props) => {
  const {
    className,
    primary,
    big: big,
    icon,
    iconComponent,
    label,
    hint,
    wide,
    secondary,
    disabled,
    translucent,
    loading,
    onClick,
    ...restProps
  } = props;

  return (
    <Container
      onClick={disabled || loading ? undefined : onClick}
      data-rh={hint ? JSON.stringify(hint) : null}
      data-rh-at="top"
      className={classNames("button", className, {
        primary,
        secondary,
        wide,
        big,
        disabled,
        translucent,
      })}
      {...restProps}
    >
      {iconComponent ? iconComponent : icon ? <Icon icon={icon} /> : null}
      {iconComponent || icon ? (
        <Spacer className={classNames({ wide })} />
      ) : null}
      {icon && label ? " " : null}
      {label ? (
        <Label className={classNames({ loading })}>{label}</Label>
      ) : null}
      {loading ? (
        <LoadingContainer>
          <LoadingCircle wide={wide} progress={0.3} />
        </LoadingContainer>
      ) : null}
    </Container>
  );
};
