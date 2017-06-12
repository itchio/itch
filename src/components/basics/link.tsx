
import * as React from "react";

import styled, * as styles from "../styles";

const LinkSpan = styled.span`
  ${styles.secondaryLink()};

  transition: color 0.4s;
  flex-shrink: 0.1;
  overflow-x: hidden;
  text-overflow: ellipsis;
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
