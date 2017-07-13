import * as React from "react";
import * as classNames from "classnames";
import styled, * as styles from "../styles";
import { lighten } from "polished";

import Icon from "./icon";
const Ink = require("react-ink");

const Label = styled.div`${styles.singleLine()};`;

const RowButtonDiv = styled.div`
  ${styles.inkContainer()};
  ${styles.singleLine()};

  font-size: ${props => props.theme.fontSizes.baseText};
  font-weight: bold;
  padding: 16px 16px;

  border: 1px solid;
  border-width: 4px 1px 1px 1px;
  border-radius: 4px;
  box-shadow: 0 1px 3px ${props => props.theme.inputBoxShadow};

  color: ${props => props.theme.baseText};

  font-size: ${props => props.theme.fontSizes.large};

  &:hover {
    background: ${props => props.theme.accent};
    border-color: ${props => props.theme.lightAccent};
    color: ${props => props.theme.secondaryTextHover};

    box-shadow: 0 0 8px ${props => props.theme.inputBoxShadow};
    cursor: pointer;
  }

  color: ${props => lighten(0.1, props.theme.baseText)};
  background: ${props => lighten(0.1, props.theme.breadBackground)};
  border-color: ${props => props.theme.inputBorder};

  &:active {
    transform: translateY(1px);
  }

  border-width: 1px;
  border-radius: 2px;
  box-shadow: none;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Spacer = styled.div`
  min-width: 8px;
  flex-shrink: 0;
`;

class RowButton extends React.PureComponent<IProps, any> {
  render() {
    const {
      className,
      icon,
      iconComponent,
      label,
      hint,
      onClick,
      ...restProps,
    } = this.props;

    return (
      <RowButtonDiv
        onClick={onClick}
        data-rh={hint}
        data-rh-at="top"
        className={classNames(className)}
        {...restProps}
      >
        {iconComponent ? iconComponent : icon ? <Icon icon={icon} /> : null}
        {iconComponent || icon ? <Spacer /> : null}
        {icon && label ? " " : null}
        {label
          ? <Label>
              {label}
            </Label>
          : null}
        {this.props.children}
        <Ink />
      </RowButtonDiv>
    );
  }
}

interface IProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  hint?: string;
  icon?: string;
  iconComponent?: JSX.Element;
  label?: JSX.Element | string;
  id?: string;
}

export default RowButton;

const TagDiv = styled.div`
  background: ${props => props.theme.baseText};
  color: ${props => props.theme.baseBackground};
  text-shadow: none;

  margin-left: 8px;

  font-size: 80%;
  padding: 4px;
  border-radius: ${props => props.theme.borderRadii.explanation};
`;

export class Tag extends React.PureComponent<{}, {}> {
  render() {
    return (
      <TagDiv>
        {this.props.children}
      </TagDiv>
    );
  }
}
