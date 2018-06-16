import React from "react";
import Icon from "renderer/basics/Icon";
import styled from "renderer/styles";

const Spacer = styled.span`
  display: inline-block;
  height: 1px;
  width: 8px;
`;

class ExperimentalMark extends React.PureComponent<{}> {
  render() {
    return (
      <span
        data-rh-at="bottom"
        data-rh={JSON.stringify(["label.experimental"])}
      >
        <Spacer />
        <Icon icon="lab-flask" />
      </span>
    );
  }
}

export default ExperimentalMark;
