import React from "react";
import styled, * as styles from "renderer/styles";
import classNames from "classnames";

const LabelEl = styled.label`
  background: ${(props) => props.theme.explanation};
  padding: 8px 11px;
  font-size: 14px;
  display: flex;
  align-items: center;

  ${styles.prefChunk};

  &.active {
    ${styles.prefChunkActive};
  }

  input[type="checkbox"] {
    margin-right: 8px;
  }
`;

class Label extends React.PureComponent<Props> {
  render() {
    const { active, children, className, ...restProps } = this.props;
    return (
      <LabelEl className={classNames(className, { active })} {...restProps}>
        {children}
      </LabelEl>
    );
  }
}

export default Label;

interface Props {
  active?: boolean;
  children?: JSX.Element | JSX.Element[];
  className?: string;
}
