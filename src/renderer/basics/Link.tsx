import React from "react";
import styled, * as styles from "renderer/styles";
import { JSXChildren, JSXChild } from "renderer/basics/jsx-types";

const LinkSpan = styled.span`
  ${styles.secondaryLink};

  transition: color 0.4s;
  flex-shrink: 0.1;
  overflow-x: hidden;
  text-overflow: ellipsis;
`;

interface Props {
  onClick?: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
  onContextMenu?: React.EventHandler<React.MouseEvent<HTMLSpanElement>>;
  label?: JSXChild;
  children?: JSXChildren;
  className?: string;
}

export const Link = (props: Props) => {
  const { label, children, ...restProps } = props;

  return (
    <LinkSpan {...restProps}>
      {label}
      {children}
    </LinkSpan>
  );
};
