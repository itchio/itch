
import * as React from "react";

import styled, * as styles from "../styles";

const LinkSpan = styled.span`
  ${styles.secondaryLink()};

  flex-shrink: 0;
  transition: color 0.4s;
`;

class Link extends React.Component<IProps, void> {
  render () {
    return <LinkSpan {...this.props}>
      {this.props.children}
    </LinkSpan>;
  }
};

class IProps {
  onClick?: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
}

export default Link;
