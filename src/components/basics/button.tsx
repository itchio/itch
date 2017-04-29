
import * as React from "react";
import * as classNames from "classnames";
import styled, * as styles from "../styles";

import Icon from "./icon";
const Ink = require("react-ink");

const ButtonDiv = styled.div`
  ${styles.inkContainer()}
  ${styles.singleLine()}
  transition: all 0.4s;

  font-size: ${props => props.theme.fontSizes.large};
  font-weight: bold;
  padding: 10px;

  border: 1px solid;
  border-width: 4px 1px 1px 1px;
  border-radius: 4px;
  box-shadow: 0 0 3px ${props => props.theme.inputBoxShadow};
  
  color: ${props => props.theme.baseText};
  text-shadow: 0 0 2px ${props => props.theme.inputTextShadow};

  &:hover {
    box-shadow: 0 0 8px ${props => props.theme.inputBoxShadow};
    cursor: pointer;
  }

  &:active {
    transform: translateY(-2px);
  }

  &.primary {
    background: ${props => props.theme.accent};
    border-color: ${props => props.theme.lightAccent};
  }

  &.discreet {
    border-width: 1px;
    border-radius: 2px;
  }

  background-color: #2B2B2B;
  border-color: #444;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Spacer = styled.div`
  width: 8px;
`;

class Button extends React.Component<IProps, any> {
  render() {
    const {primary, discreet, icon, iconComponent, label, hint, onClick, ...restProps} = this.props;

    return <ButtonDiv
        onClick={onClick}
        data-rh={hint}
        data-rh-at="top"
        className={classNames({primary, discreet})}
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
      ? label
      : null}
      <Ink/>
    </ButtonDiv>;
  }
}

interface IProps {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  primary?: boolean;
  hint?: string;
  icon?: string;
  iconComponent?: JSX.Element;
  label: string;
  discreet?: boolean;
}

export default Button;
