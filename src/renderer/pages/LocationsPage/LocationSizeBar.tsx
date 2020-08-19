import React from "react";
import { InstallLocationSummary } from "common/butlerd/messages";
import styled, * as styles from "renderer/styles";
import { fileSize } from "common/format/filesize";
import { T } from "renderer/t";

const LocationSizeDiv = styled.div`
  width: 400px;

  .progress-wrapper {
    font-size: ${(props) => props.theme.fontSizes.smaller};
    &:hover {
      cursor: pointer;
    }
  }

  .progress {
    background: #555;
    padding: 2px 8px;
    position: relative;
    ${styles.singleLine};

    &,
    .progress-inner {
      border-radius: 2px;
    }

    .progress-inner {
      background: white;
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
    }

    .progress-label {
      color: white;
      mix-blend-mode: difference;
    }
  }
`;

export default class LocationSizeBar extends React.PureComponent<Props> {
  render() {
    const { location } = this.props;
    if (!location) {
      return null;
    }
    const { sizeInfo } = location;
    if (!sizeInfo || sizeInfo.totalSize < 0) {
      return "Not available";
    }

    const { totalSize, freeSize, installedSize } = sizeInfo;

    return (
      <LocationSizeDiv>
        <div
          className="progress-wrapper"
          data-rh={JSON.stringify([
            "preferences.install_location.size_used_by_games",
            { installedSize: fileSize(installedSize) },
          ])}
        >
          <div className="progress">
            <div
              className="progress-inner"
              style={{
                right: `${(freeSize / totalSize) * 100}%`,
              }}
            />
            <span className="progress-label">
              {T([
                "preferences.install_location.free_of_total",
                {
                  freeSize: fileSize(freeSize),
                  totalSize: fileSize(totalSize),
                },
              ])}
            </span>
          </div>
        </div>
      </LocationSizeDiv>
    );
  }
}

interface Props {
  location: InstallLocationSummary;
}
