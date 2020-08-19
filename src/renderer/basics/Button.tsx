import classNames from "classnames";
import { LocalizedString } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import styled, * as styles from "renderer/styles";

const Label = styled.div`
  ${styles.singleLine};
`;

const ButtonDiv = styled.div`
  ${styles.singleLine};
  transition: all 0.2s;

  font-size: ${(props) => props.theme.fontSizes.baseText};
  font-weight: normal;
  padding: 4px 10px;

  border: 1px solid;
  border-width: 4px 1px 1px 1px;
  border-radius: 3px;

  background-image: linear-gradient(
    10deg,
    hsla(355, 40%, 21%, 1),
    hsla(355, 40%, 32%, 1)
  );
  border-color: hsla(355, 40%, 44%, 1);

  box-shadow: 0 1px 3px ${(props) => props.theme.inputBoxShadow};
  text-shadow: 0px 1px rgba(0, 0, 0, 0.4);

  color: ${(props) => props.theme.baseText};
  min-height: 38px;
  min-width: 7em;

  &:hover {
    box-shadow: 0 0 8px ${(props) => props.theme.inputBoxShadow};
    cursor: pointer;
  }

  &:active {
    transform: translateY(1px);
  }

  &.primary {
    font-weight: bold;
    background-image: linear-gradient(
      10deg,
      hsla(355, 50%, 32%, 1),
      hsla(355, 50%, 48%, 1)
    );
    border-color: hsla(355, 40%, 52%, 1);
  }

  &.fat {
    font-size: ${(props) => props.theme.fontSizes.huge};
    font-weight: bold;
    padding: 16px 80px;
  }

  &.wide {
    min-width: 160px;
    justify-content: center;
    font-size: ${(props) => props.theme.fontSizes.large};
    padding-top: 16px;
    padding-bottom: 12px;
    padding-left: 20px;
    padding-right: 20px;
    font-weight: normal;
  }

  &.disabled {
    opacity: 0.2;
    &:hover {
      cursor: not-allowed;
    }
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
`;

const Spacer = styled.div`
  min-width: 8px;
  flex-shrink: 0;

  &.wide {
    min-width: 12px;
  }
`;

class Button extends React.PureComponent<Props, any> {
  render() {
    const {
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
      ...restProps
    } = this.props;

    return (
      <ButtonDiv
        onClick={disabled ? null : onClick}
        data-rh={hint ? JSON.stringify(hint) : null}
        data-rh-at="top"
        className={classNames(className, {
          primary,
          wide,
          fat,
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
        {label ? <Label>{label}</Label> : null}
        {this.props.children}
      </ButtonDiv>
    );
  }
}

interface Props {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
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
}

export default Button;
