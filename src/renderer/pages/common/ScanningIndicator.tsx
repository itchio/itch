import classNames from "classnames";
import React from "react";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const ScanningIndicatorDiv = styled.div`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  height: 15px;
  opacity: 0;
  transition: all 0.4s;

  display: flex;
  flex-flow: row;
  align-items: center;
  padding: 0 12px;

  .spacer {
    width: 8px;
  }

  &.active {
    opacity: 1;
  }
`;

class ScanningIndicator extends React.PureComponent<Props> {
  render() {
    const { progress } = this.props;
    const active = progress !== null;

    return (
      <ScanningIndicatorDiv className={classNames({ active })}>
        {active ? (
          <>
            <LoadingCircle progress={progress} />
            <div className="spacer" />
            {T(_("preferences.scan_install_locations.title"))}
          </>
        ) : null}
      </ScanningIndicatorDiv>
    );
  }
}

interface Props {
  progress: number | null;
}

export default hook((map) => ({
  progress: map((rs) => rs.system.locationScanProgress),
}))(ScanningIndicator);
