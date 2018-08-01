import classNames from "classnames";
import { LocalizedString } from "common/types";
import React from "react";
import styled, * as styles from "renderer/styles";
import Icon from "renderer/basics/Icon";

const IconButtonDiv = styled.div`
  ${styles.clickable};

  font-size: ${props => props.theme.fontSizes.baseText};
  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  &:hover {
    color: ${props => props.theme.secondaryTextHover};
  }

  &.disabled {
    opacity: 0.2;
    pointer: disabled;
  }

  &.emphasized {
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &.big {
    font-size: ${props => props.theme.fontSizes.huge};
    width: 36px;
    height: 36px;
  }

  &.huge {
    font-size: ${props => props.theme.fontSizes.huger};
    width: 48px;
    height: 48px;
  }
`;

class IconButton extends React.PureComponent<Props> {
  render() {
    const {
      className,
      big,
      huge,
      emphasized,
      disabled,
      icon,
      hint,
      hintPosition = "top",
      ...restProps
    } = this.props;

    return (
      <IconButtonDiv
        className={classNames(className, { disabled, big, huge, emphasized })}
        data-rh={hint ? JSON.stringify(hint) : null}
        data-rh-at={hintPosition}
        {...restProps}
      >
        {typeof icon === "string" ? <Icon icon={icon} /> : icon}
      </IconButtonDiv>
    );
  }
}

interface Props {
  icon: string | JSX.Element;
  disabled?: boolean;
  className?: string;
  id?: string;
  hint?: LocalizedString;
  hintPosition?: "top" | "left" | "right" | "bottom";

  onClick?: React.MouseEventHandler<HTMLElement>;
  onContextMenu?: React.MouseEventHandler<HTMLElement>;
  big?: boolean;
  huge?: boolean;
  emphasized?: boolean;
}

export default IconButton;
