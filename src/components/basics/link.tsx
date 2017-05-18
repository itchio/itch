
import * as React from "react";

import styled, * as styles from "../styles";

const LinkSpan = styled.span`
  ${styles.secondaryLink()};

  flex-shrink: 0;
  transition: color 0.4s;
`;

class Link extends React.PureComponent<IProps, void> {
  render () {
    const {label, ...restProps} = this.props;

    return <LinkSpan {...restProps}>
      {label}
    </LinkSpan>;
  }
};

class IProps {
  onClick?: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
  label?: string;
}

export default Link;
