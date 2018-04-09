import React from "react";
import classNames from "classnames";
import styled, * as styles from "../styles";
import { lighten } from "polished";

import Icon from "./icon";

const LargeIcon = styled(Icon)`
  font-size: 20px;
`;

const Label = styled.div`
  ${styles.singleLine()};
`;

const RowButtonDiv = styled.div`
  ${styles.singleLine()};

  font-size: ${props => props.theme.fontSizes.baseText};
  font-weight: bold;
  padding: 8px 16px;

  border: 1px solid;
  border-width: 4px 1px 1px 1px;
  border-radius: 4px;
  box-shadow: 0 1px 3px ${props => props.theme.inputBoxShadow};

  color: ${props => props.theme.baseText};

  font-size: ${props => props.theme.fontSizes.large};

  &:hover {
    background: ${props => lighten(0.12, props.theme.breadBackground)};
    border-color: ${props => lighten(0.1, props.theme.inputBorder)};
    color: ${props => props.theme.secondaryTextHover};

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

  min-width: 450px;
`;

const Spacer = styled.div`
  min-width: 8px;
  flex-shrink: 0;

  &.large {
    min-width: 16px;
  }
`;

class RowButton extends React.PureComponent<IProps, any> {
  render() {
    let {
      className,
      icon,
      iconComponent,
      label,
      hint,
      onClick,
      ink = true,
      ...restProps
    } = this.props;

    if (!iconComponent && icon) {
      iconComponent = <LargeIcon icon={icon} />;
    }

    return (
      <RowButtonDiv
        onClick={onClick}
        data-rh={hint ? JSON.stringify(hint) : null}
        data-rh-at="top"
        className={classNames(className)}
        {...restProps}
      >
        {iconComponent ? (
          <>
            {iconComponent}
            <Spacer className="large" />
          </>
        ) : null}
        {iconComponent && label ? " " : null}
        {label ? <Label>{label}</Label> : null}
        {this.props.children}
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
  ink?: boolean;
}

export default RowButton;

const TagDiv = styled.div`
  color: ${props => props.theme.secondaryText};
  text-shadow: none;

  font-size: 80%;
  padding-right: 8px;
  &:last-child {
    padding-right: 0;
  }

  border-radius: ${props => props.theme.borderRadii.explanation};
`;

export class Tag extends React.PureComponent<{}, {}> {
  render() {
    return <TagDiv>{this.props.children}</TagDiv>;
  }
}
