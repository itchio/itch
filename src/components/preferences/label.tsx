import * as React from "react";
import styled, * as styles from "../styles";
import * as classNames from "classnames";

const LabelEl = styled.label`
  background: ${props => props.theme.explanation};
  padding: 8px 11px;
  font-size: 14px;
  display: flex;
  align-items: center;

  ${styles.prefChunk()};

  &.active {
    ${styles.prefChunkActive()};
  }

  input[type="checkbox"] {
    margin-right: 8px;
  }
`;

class Label extends React.PureComponent<IProps> {
  render() {
    const { active, children } = this.props;
    return <LabelEl className={classNames({ active })}>{children}</LabelEl>;
  }
}

export default Label;

interface IProps {
  active?: boolean;
  children?: JSX.Element | JSX.Element[];
}
