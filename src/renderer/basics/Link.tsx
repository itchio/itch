import React from "react";
import styled, * as styles from "renderer/styles";

const LinkSpan = styled.span`
  ${styles.secondaryLink};

  transition: color 0.4s;
  flex-shrink: 0.1;
  overflow-x: hidden;
  text-overflow: ellipsis;
`;

class Link extends React.PureComponent<Props> {
  render() {
    const { label, children, ...restProps } = this.props;

    return (
      <LinkSpan {...restProps}>
        {label}
        {children}
      </LinkSpan>
    );
  }
}

export default Link;

class Props {
  onClick?: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
  onContextMenu?: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
  label?: JSX.Element | string;
  children?: string | JSX.Element | (string | JSX.Element)[];
  className?: string;
}
