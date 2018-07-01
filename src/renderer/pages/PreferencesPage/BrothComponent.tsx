import { PackageState } from "common/types";
import React from "react";
import DownloadProgress from "renderer/basics/DownloadProgress";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hookWithProps } from "renderer/hocs/hook";

class BrothComponent extends React.PureComponent<Props> {
  render() {
    const { name, pkg } = this.props;

    return (
      <div className="section component">
        {this.renderIcon()}
        &nbsp;
        {name} @ {this.formatPackageVersion(pkg.version)}
        &nbsp;
        {this.renderProgress()}
      </div>
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
          &nbsp;
          <LoadingCircle progress={progressInfo.progress} />
          <DownloadProgress eta={eta} bps={bps} downloadsPaused={false} />
        </>
      );
    }

    if (pkg.stage === "assess" || pkg.stage === "install") {
      return (
        <>
          &nbsp;
          <LoadingCircle progress={-1} />
        </>
      );
    }

    return null;
  }

  formatPackageVersion(v: string): string {
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

export default hookWithProps(BrothComponent)(map => ({
  pkg: map((rs, props) => rs.broth.packages[props.name]),
}))(BrothComponent);
