import React from "react";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import Vivus from "vivus";

const appWhiteContour = require("static/images/logos/app-white-contour.svg");

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

class LogoIndicator extends React.PureComponent<Props> {
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

interface Props {
  progress: number;
}

export default hook(map => ({
  progress: map(rs => {
    const { blockingOperation, done } = rs.setup;
    if (done) {
      return 1.0;
    } else {
      if (blockingOperation && blockingOperation.progressInfo) {
        return blockingOperation.progressInfo.progress;
      } else {
        return 0.0;
      }
    }
  }),
}))(LogoIndicator);
