import React from "react";
import styled, * as styles from "renderer/styles";

interface Props {
  onClick?: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
  onContextMenu?: React.EventHandler<React.MouseEvent<HTMLButtonElement>>;
  label?: JSX.Element | string;
  children?: string | JSX.Element | (string | JSX.Element)[];
  className?: string;
}

const LinkButton = styled.button`
  ${styles.resetButton};

  ${styles.secondaryLink};

  transition: color 0.4s;
  flex-shrink: 0.1;
  overflow-x: hidden;
  text-overflow: ellipsis;
`;

const Link: React.FC<Props> = (props) => {
  const { label, children, ...restProps } = props;

  return (
    <LinkButton type="button" {...restProps}>
      {label}
      {children}
    </LinkButton>
  );
};

export default React.memo(Link);
