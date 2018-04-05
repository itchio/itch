import React from "react";
import classNames from "classnames";
import styled from "../styles";

import Icon from "./icon";

const CriterionDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 10px;
  border-radius: 2px;
  margin: 4px;

  transition: background 0.2s, -webkit-filter 0.2s;
  -webkit-filter: brightness(60%);

  &:hover {
    cursor: pointer;
    -webkit-filter: brightness(100%);
  }

  &.checked {
    background: rgba(255, 255, 255, 0.18);
    -webkit-filter: brightness(100%);
  }

  .ballot-box {
    width: 1em;
    height: 1em;
    border: 1px solid white;
  }

  .spacer {
    width: 8px;
    height: 1px;
  }
`;

class Criterion extends React.PureComponent<IProps> {
  render() {
    const { label, checked, onChange } = this.props;

    return (
      <CriterionDiv
        className={classNames({ checked })}
        onClick={() => onChange(!checked)}
      >
        {checked ? <Icon icon="cross" /> : <div className="ballot-box" />}
        <div className="spacer" />
        {label}
      </CriterionDiv>
    );
  }
}

export default Criterion;

interface IProps {
  label: string | JSX.Element;
  checked: boolean;
  onChange: (checked: boolean) => void;
}
