import * as React from "react";
import * as classNames from "classnames";
import styled, * as styles from "../styles";

import Icon from "./icon";

const Label = styled.div`${styles.singleLine()};`;

const ButtonDiv = styled.div`
  ${styles.singleLine()};

  font-size: ${props => props.theme.fontSizes.baseText};
  font-weight: bold;
  padding: 4px 10px 3px 10px;

  border: 1px solid;
  border-width: 4px 1px 1px 1px;
  border-radius: 3px;
  box-shadow: 0 1px 3px ${props => props.theme.inputBoxShadow};
  text-shadow: 0px 1px rgba(0, 0, 0, 0.4);

  color: ${props => props.theme.baseText};
  min-height: 38px;
  min-width: 7em;

  &:hover {
    box-shadow: 0 0 8px ${props => props.theme.inputBoxShadow};
    cursor: pointer;
  }

  &:active {
    transform: translateY(1px);
  }

  &.primary {
    background: ${props => props.theme.accent};
    border-color: ${props => props.theme.lightAccent};
  }

  &.discreet {
    border-width: 1px;
    border-radius: 2px;
    box-shadow: none;
  }

  &.fat {
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

  background-color: #2b2b2b;
  border-color: #444;

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

class Button extends React.PureComponent<IProps, any> {
  render() {
    const {
      className,
      primary,
      discreet,
      fat,
      icon,
      iconComponent,
      label,
      hint,
      wide,
      onClick,
      ...restProps,
    } = this.props;

    return (
      <ButtonDiv
        onClick={onClick}
        data-rh={hint}
        data-rh-at="top"
        className={classNames(className, { primary, discreet, wide, fat })}
        {...restProps}
      >
        {iconComponent ? iconComponent : icon ? <Icon icon={icon} /> : null}
        {iconComponent || icon
          ? <Spacer className={classNames({ wide })} />
          : null}
        {icon && label ? " " : null}
        {label
          ? <Label>
              {label}
            </Label>
          : null}
        {this.props.children}
      </ButtonDiv>
    );
  }
}

interface IProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  primary?: boolean;
  hint?: string;
  icon?: string;
  iconComponent?: JSX.Element;
  label?: JSX.Element | string;
  discreet?: boolean;
  wide?: boolean;
  fat?: boolean;
  id?: string;
}

export default Button;
