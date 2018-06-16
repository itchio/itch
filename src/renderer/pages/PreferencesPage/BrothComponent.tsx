import React from "react";
import { createStructuredSelector } from "reselect";
import { connect } from "renderer/hocs/connect";

import Icon from "renderer/basics/Icon";
import { IRootState, PackageState } from "common/types";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { downloadProgress } from "common/format/download-progress";

class BrothComponent extends React.PureComponent<Props & DerivedProps> {
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
      console.log("progressInfo = ", progressInfo);
      const { eta = 0, bps = 0 } = progressInfo;
      return (
        <>
          &nbsp;
          <LoadingCircle progress={progressInfo.progress} />
          {downloadProgress({ eta, bps }, false)}
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
}

interface DerivedProps {
  pkg: PackageState;
}

export default connect<Props>(
  BrothComponent,
  {
    state: createStructuredSelector({
      pkg: (rs: IRootState, props: Props) => rs.broth.packages[props.name],
    }),
  }
);
