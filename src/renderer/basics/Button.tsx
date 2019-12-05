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
  const border = lighten(0.1, bg);

  return css`
    background-color: ${bg};
    border-color: ${border};

    &:hover {
      border-color: ${lighten(0.1, border)};
    }

    &:focus {
      outline: none;
      border-color: ${lighten(0.2, border)};
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

  border: 1px solid;
  border-radius: 2px;

  box-shadow: 0 1px 3px ${props => props.theme.inputBoxShadow};

  color: ${props => props.theme.baseText};
  min-height: 38px;
  min-width: 7em;

  ${buttonColors("#a83737")}

  &.secondary {
    ${buttonColors("hsl(214, 32%, 16%)")}
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
    opacity: 0.4;
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

  &.wide {
    min-width: 1.6em;
  }
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
      className={classNames(className, {
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
