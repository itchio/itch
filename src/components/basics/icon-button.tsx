import * as React from "react";
import * as classNames from "classnames";

import Icon from "./icon";
const Ink = require("react-ink");

import styled, * as styles from "../styles";

const IconButtonDiv = styled.div`
  display: inline-block;
  ${styles.inkContainer()}
  ${styles.iconButton()}
  ${styles.clickable()}

  font-size: ${props => props.theme.fontSizes.baseText};
  display: flex;
  align-items: center;
  justify-content: center;

  &.disabled {
    opacity: 0.2;
    pointer: disabled;
  }
`;

class IconButton extends React.PureComponent<IProps, void> {
  render() {
    const {
      disabled,
      icon,
      hint,
      hintPosition = "top",
      ...restProps,
    } = this.props;

    return (
      <IconButtonDiv
        className={classNames({ disabled })}
        data-rh={hint}
        data-rh-at={hintPosition}
        {...restProps}
      >
        <Icon icon={icon} />
        {disabled ? null : <Ink />}
      </IconButtonDiv>
    );
  }
}

interface IProps {
  icon: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  hint?: string;
  hintPosition?: "top" | "left" | "right" | "bottom";

  onClick?: any;
}

export default IconButton;
