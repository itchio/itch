import React from "react";
import styled, * as styles from "renderer/styles";

const LinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font: inherit;

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
      <LinkButton {...restProps}>
        {label}
        {children}
      </LinkButton>
    );
  }
}

export default Link;

class Props {
  onClick?: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
  onContextMenu?: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
  label?: JSX.Element | string;
  children?: string | JSX.Element | (string | JSX.Element)[];
  className?: string;
}
