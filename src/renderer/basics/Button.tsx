import classNames from "classnames";
import React from "react";
import { Icon } from "renderer/basics/Icon";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import { fontSizes, mixins } from "renderer/theme";
import styled from "styled-components";

const Label = styled.div`
  ${mixins.singleLine};
  text-shadow: 0px 1px rgba(0, 0, 0, 0.4);

  &.loading {
    /* this way we keep the width of the button */
    visibility: hidden;
  }
`;

const Container = styled.button`
  position: relative;

  ${mixins.singleLine};
  transition: ease-out 0.1s;

  font-size: ${fontSizes.normal};
  font-weight: normal;
  padding: 12px 16px;

  border-radius: 2px;

  min-height: 38px;
  min-width: 7em;

  cursor: pointer;

  color: ${p => p.theme.colors.button1Text};
  border: 1px solid ${p => p.theme.colors.button1Border};
  background-color: ${p => p.theme.colors.button1Bg};

  &:hover {
    background-color: ${p => p.theme.colors.button1BgHover};
  }

  &:focus {
    outline: none;
  }

  &:active {
    background-color: ${p => p.theme.colors.button1BgActive};
  }

  &.secondary {
    color: ${p => p.theme.colors.button2Text};
    border: 1px solid ${p => p.theme.colors.button2Border};
    background-color: ${p => p.theme.colors.button2Bg};

    &:hover {
      background-color: ${p => p.theme.colors.button2BgHover};
    }

    &:active {
      background-color: ${p => p.theme.colors.button2BgActive};
    }
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
  icon?: string;
  iconComponent?: React.ReactNode;
  label?: React.ReactNode;
  wide?: boolean;
  big?: boolean;
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  id?: string;
  translucent?: boolean;
  secondary?: boolean;
}

export const Button = React.forwardRef(
  (props: Props, ref: React.Ref<HTMLButtonElement>) => {
    const {
      className,
      primary,
      big: big,
      icon,
      iconComponent,
      label,
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
        ref={ref}
        onClick={disabled || loading ? undefined : onClick}
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
          <Label className={classNames("button-label", { loading })}>
            {label}
          </Label>
        ) : null}
        {loading ? (
          <LoadingContainer>
            <LoadingCircle wide={wide} progress={0.3} />
          </LoadingContainer>
        ) : null}
      </Container>
    );
  }
);
