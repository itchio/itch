
import * as React from "react";
import * as classNames from "classnames";
import styled, * as styles from "../styles";

import Icon from "./icon";
const Ink = require("react-ink");

const Label = styled.div`
  ${styles.singleLine()}  
`;

const ButtonDiv = styled.div`
  ${styles.inkContainer()}
  ${styles.singleLine()}

  transition: all 0.4s;

  font-size: ${props => props.theme.fontSizes.baseText};
  font-weight: bold;
  padding: 4px 10px;

  border: 1px solid;
  border-width: 4px 1px 1px 1px;
  border-radius: 4px;
  box-shadow: 0 1px 3px ${props => props.theme.inputBoxShadow};
  
  color: ${props => props.theme.baseText};
  ${styles.accentTextShadow()}

  min-height: 38px;

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

  background-color: #2B2B2B;
  border-color: #444;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Spacer = styled.div`
  min-width: 8px;
  flex-shrink: 0;
`;

class Button extends React.PureComponent<IProps, any> {
  render() {
    const {
      className, primary, discreet, fat,
      icon, iconComponent, label, hint, onClick,
      ...restProps,
    } = this.props;

    return <ButtonDiv
        onClick={onClick}
        data-rh={hint}
        data-rh-at="top"
        className={classNames(className, {primary, discreet, fat})}
        {...restProps}>
      {iconComponent
      ? iconComponent
      : (icon
        ? <Icon icon={icon}/>
        : null
      )}
      {(iconComponent || icon)
      ? <Spacer/>
      : null
      }
      {icon && label
      ? " "
      : null}
      {label
      ? <Label>{label}</Label>
      : null}
      {this.props.children}
      <Ink/>
    </ButtonDiv>;
  }
}

interface IProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  primary?: boolean;
  hint?: string;
  icon?: string;
  iconComponent?: JSX.Element;
  label?: string;
  discreet?: boolean;
  fat?: boolean;
}

export default Button;
