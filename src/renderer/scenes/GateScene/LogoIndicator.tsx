import React from "react";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import Vivus from "vivus";

const appWhiteContour = require("static/images/logos/app-white-contour.svg")
  .default;

const appBlackContour = require("static/images/logos/app-black-contour.svg")
  .default;

const LogoIndicatorDiv = styled.div`
  pointer-events: none;

  margin-top: 50px;

  &,
  svg {
    height: 170px;
    width: 430px;
  }

  svg {
    display: block;
    overflow: hidden;

    path {
      transition: stroke-dashoffset 2s ease-out;
    }
  }
`;

class LogoIndicator extends React.PureComponent<Props, State> {
  vivus: Vivus;

  constructor(props: LogoIndicator["props"], context: any) {
    super(props, context);
    this.state = {
      progress: 0,
      lightMode: false,
    };
  }

  render() {
    return <LogoIndicatorDiv id="logo-indicator-div" ref={this.gotEl} />;
  }

  gotEl = (el: HTMLDivElement) => {
    const { lightMode } = this.props;

    if (el) {
      new Vivus(el.id, {
        file: lightMode ? appBlackContour : appWhiteContour,
        type: "delayed",
        start: "manual",
        animTimingFunction: Vivus.EASE_OUT,
        onReady: (vivus) => {
          this.vivus = vivus;
          this.update();
        },
      });
    }
  };

  componentDidUpdate() {
    this.update();
  }

  update = () => {
    if (this.vivus) {
      this.vivus.setFrameProgress(this.props.progress);
    }
  };
}

interface Props {
  progress: number;
  lightMode: boolean;
}

interface State {
  progress: number;
  lightMode: boolean;
}

export default hook((map) => ({
  progress: map((rs) => {
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
  lightMode: map((rs) => rs.preferences.lightMode),
}))(LogoIndicator);
