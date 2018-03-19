import * as React from "react";
import Icon from "../basics/icon";
import styled from "../styles";

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
