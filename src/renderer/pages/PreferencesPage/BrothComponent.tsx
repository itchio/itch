import { PackageState } from "common/types";
import React from "react";
import DownloadProgressSpan from "renderer/basics/DownloadProgressSpan";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hookWithProps } from "renderer/hocs/hook";
import styled from "renderer/styles";

const BrothComponentDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
`;

const Spacer = styled.div`
  width: 8px;
`;

class BrothComponent extends React.PureComponent<Props> {
  render() {
    const { name, pkg } = this.props;

    return (
      <BrothComponentDiv className="section component">
        {this.renderIcon()}
        <Spacer />
        {name} @ {this.formatPackageVersion(pkg.version)}
        <Spacer />
        {this.renderProgress()}
      </BrothComponentDiv>
    );
  }

  renderIcon() {
    switch (this.props.pkg.stage) {
      case "idle":
        return <Icon icon="checkmark" />;
      case "assess":
        return <Icon icon="stopwatch" />;
      case "download":
        return <Icon icon="download" />;
      case "install":
        return <Icon icon="install" />;
      case "need-restart":
        return <Icon icon="repeat" />;
    }
    return null;
  }

  renderProgress() {
    const { pkg } = this.props;
    const { progressInfo } = pkg;
    if (progressInfo) {
      const { eta = 0, bps = 0 } = progressInfo;
      return (
        <>
          <Spacer />
          <LoadingCircle progress={progressInfo.progress} />
          <Spacer />
          <DownloadProgressSpan eta={eta} bps={bps} downloadsPaused={false} />
        </>
      );
    }

    if (pkg.stage === "assess" || pkg.stage === "install") {
      return (
        <>
          <Spacer />
          <LoadingCircle progress={-1} />
        </>
      );
    }

    return null;
  }

  formatPackageVersion(v: string): string {
    if (!v) {
      return "∅";
    }

    if (/[a-z0-9]/.test(v)) {
      return v.substr(0, 7);
    }
    return v;
  }
}

interface Props {
  name: string;

  pkg: PackageState;
}

export default hookWithProps(BrothComponent)((map) => ({
  pkg: map((rs, props) => rs.broth.packages[props.name]),
}))(BrothComponent);
