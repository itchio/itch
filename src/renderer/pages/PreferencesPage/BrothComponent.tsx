import { actions } from "common/actions";
import { PackageState } from "common/types";
import urls from "common/constants/urls";
import React, { useState } from "react";
import DownloadProgressSpan from "renderer/basics/DownloadProgressSpan";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import styled, * as styles from "renderer/styles";

const BrothComponentButton = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  width: 100%;

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

  .detail-link {
    ${styles.resetButton};
    font: inherit;
    color: inherit;
    cursor: pointer;
    border-bottom: 1px solid;
    user-select: text;
    word-break: break-all;
  }
`;

const releasesPages: Record<string, string> = {
  itch: urls.releasesPage,
  kitch: urls.releasesPage,
  butler: urls.butlerReleasesPage,
  "itch-setup": urls.itchSetupReleasesPage,
};

const stageIcons: Record<PackageState["stage"], string> = {
  idle: "checkmark",
  assess: "stopwatch",
  download: "download",
  install: "install",
  "need-restart": "repeat",
};

function formatPackageVersion(v: string | undefined): string {
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

const Progress = ({ pkg }: { pkg: PackageState }) => {
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
};

interface DetailsProps {
  name: string;
  pkg: PackageState;
}

const Details = ({ name, pkg }: DetailsProps) => {
  const dispatch = useAppDispatch();

  const executablePath = pkg.versionPrefix
    ? `${pkg.versionPrefix}${pkg.versionPrefix.endsWith("/") ? "" : "/"}${name}`
    : "N/A";
  const installDir = pkg.versionPrefix || "N/A";
  const fullVersion = pkg.version || "N/A";
  const sourceUrl = pkg.channel
    ? `${urls.brothRepo}/${name}/${pkg.channel}`
    : null;
  const releasesUrl: string | undefined = releasesPages[name];

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
      {releasesUrl && (
        <div className="detail-row">
          <span className="detail-label">Release Notes:</span>
          <button
            type="button"
            className="detail-link"
            onClick={() =>
              dispatch(actions.openInExternalBrowser({ url: releasesUrl }))
            }
          >
            {releasesUrl}
          </button>
        </div>
      )}
    </ComponentDetails>
  );
};

const BrothComponent = ({ name }: { name: string }) => {
  const pkg = useAppSelector((rs) => rs.broth.packages[name]);
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <BrothComponentButton
        className="section component"
        onClick={() => setExpanded((expanded) => !expanded)}
      >
        <Icon
          icon="triangle-right"
          className={`turner ${expanded ? "turned" : ""}`}
        />
        <Spacer />
        <Icon icon={stageIcons[pkg.stage]} />
        <Spacer />
        {name} @ {formatPackageVersion(pkg.version)}
        <Spacer />
        <Progress pkg={pkg} />
      </BrothComponentButton>
      {expanded && <Details name={name} pkg={pkg} />}
    </div>
  );
};

export default BrothComponent;
