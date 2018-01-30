import * as React from "react";

import styled, * as styles from "../styles";

const LinkSpan = styled.span`
  ${styles.secondaryLink()};

  transition: color 0.4s;
  flex-shrink: 0.1;
  overflow-x: hidden;
  text-overflow: ellipsis;
`;

export default class Link extends React.PureComponent<IProps> {
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

class IProps {
  onClick?: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
  label?: JSX.Element | string;
  children?: string | JSX.Element | JSX.Element[];
  className?: string;
}
