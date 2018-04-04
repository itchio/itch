import * as React from "react";
import * as Vivus from "vivus";
import { IRootState } from "../../../types";
import { connect } from "../../connect";
import styled from "../../styles";

const appWhiteContour = require("../../../static/images/logos/app-white-contour.svg");

const LogoIndicatorDiv = styled.div`
  pointer-events: none;

  margin-top: 50px;

  svg {
    display: block;
    height: 170px;
    width: 430px;
    overflow: hidden;

    path {
      transition: stroke-dashoffset 2s ease-out;
    }
  }
`;

class LogoIndicator extends React.PureComponent<IProps & IDerivedProps> {
  vivus: Vivus;
  progress = 0;

  render() {
    return <LogoIndicatorDiv id="logo-indicator-div" innerRef={this.gotEl} />;
  }

  gotEl = (el: HTMLDivElement) => {
    if (el) {
      new Vivus(el.id, {
        file: appWhiteContour,
        type: "delayed",
        start: "manual",
        animTimingFunction: Vivus.EASE_OUT,
        onReady: vivus => {
          this.vivus = vivus;
          this.vivus.setFrameProgress(0);
          this.update(this.props);
        },
      });
    }
  };

  componentDidUpdate(props: LogoIndicator["props"]) {
    this.update(props);
  }

  update = (props: LogoIndicator["props"]) => {
    if (this.vivus) {
      this.vivus.setFrameProgress(props.progress);
    }
  };
}

interface IProps {}

interface IDerivedProps {
  progress?: number;
}

export default connect<IProps>(LogoIndicator, {
  state: (rs: IRootState) => {
    let progress: number;
    const { blockingOperation, done } = rs.setup;
    if (done) {
      progress = 1.0;
    } else {
      if (blockingOperation && blockingOperation.progressInfo) {
        progress = blockingOperation.progressInfo.progress;
      } else {
        progress = 0.0;
      }
    }
    return { progress };
  },
});
