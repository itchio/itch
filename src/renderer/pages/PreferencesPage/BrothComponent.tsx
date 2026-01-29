import { PackageState } from "common/types";
import urls from "common/constants/urls";
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
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const Spacer = styled.div`
  width: 8px;
`;

const ComponentDetails = styled.div`
  margin-left: 32px;
  margin-top: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #b9b9b9;

  .detail-row {
    display: flex;
    margin: 4px 0;
  }

  .detail-label {
    width: 100px;
    flex-shrink: 0;
    color: #888;
  }

  .detail-value {
    font-family: monospace;
    user-select: text;
    word-break: break-all;
  }
`;

interface State {
  expanded: boolean;
}

class BrothComponent extends React.PureComponent<Props, State> {
  state: State = {
    expanded: false,
  };

  toggleExpanded = () => {
    this.setState((state) => ({ expanded: !state.expanded }));
  };

  render() {
    const { name, pkg } = this.props;
    const { expanded } = this.state;

    return (
      <div>
        <BrothComponentDiv
          className="section component"
          onClick={this.toggleExpanded}
        >
          <Icon
            icon="triangle-right"
            className={`turner ${expanded ? "turned" : ""}`}
          />
          <Spacer />
          {this.renderIcon()}
          <Spacer />
          {name} @ {this.formatPackageVersion(pkg.version)}
          <Spacer />
          {this.renderProgress()}
        </BrothComponentDiv>
        {expanded && this.renderDetails()}
      </div>
    );
  }

  renderDetails() {
    const { name, pkg } = this.props;

    const executablePath = pkg.versionPrefix
      ? `${pkg.versionPrefix}${
          pkg.versionPrefix.endsWith("/") ? "" : "/"
        }${name}`
      : "N/A";
    const installDir = pkg.versionPrefix || "N/A";
    const fullVersion = pkg.version || "N/A";
    const sourceUrl = pkg.channel
      ? `${urls.brothRepo}/${name}/${pkg.channel}`
      : null;

    return (
      <ComponentDetails>
        <div className="detail-row">
          <span className="detail-label">Executable:</span>
          <span className="detail-value">{executablePath}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Version:</span>
          <span className="detail-value">{fullVersion}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Directory:</span>
          <span className="detail-value">{installDir}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Stage:</span>
          <span className="detail-value">{pkg.stage}</span>
        </div>
        {pkg.stage === "need-restart" && pkg.availableVersion && (
          <div className="detail-row">
            <span className="detail-label">Pending:</span>
            <span className="detail-value">{pkg.availableVersion}</span>
          </div>
        )}
        {sourceUrl && (
          <div className="detail-row">
            <span className="detail-label">Source:</span>
            <span className="detail-value">{sourceUrl}</span>
          </div>
        )}
      </ComponentDetails>
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

    // Show full version for local dev builds
    if (v.startsWith("head")) {
      return v;
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
