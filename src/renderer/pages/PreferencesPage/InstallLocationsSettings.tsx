import classNames from "classnames";
import { actions } from "common/actions/index";
import { messages } from "common/butlerd/index";
import { InstallLocationSummary } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { Dispatch, MenuTemplate } from "common/types";
import { ambientWind, urlForInstallLocation } from "common/util/navigation";
import React from "react";
import Button from "renderer/basics/Button";
import IconButton from "renderer/basics/IconButton";
import { rcall } from "renderer/butlerd/rcall";
import { hook } from "renderer/hocs/hook";
import watching, { Watcher } from "renderer/hocs/watching";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { findWhere, size } from "underscore";

const LocationTable = styled.table`
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
  background-color: $explanation-color;

  td {
    padding: 4px 15px;
    text-align: left;
    background: ${props => props.theme.explanation};

    &:first-child {
      ${styles.prefChunk()};
    }
  }

  tr.default {
    td {
      &:first-child {
        ${styles.prefChunkActive()};
      }
    }
  }

  td {
    color: #999;
    max-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .icon-action {
    padding-left: 0;
    padding-right: 0;

    text-align: center;
  }

  td.path-column {
    color: ${props => props.theme.baseText};
    min-width: 160px;
    width: 50%;

    .default-state {
      padding-left: 1em;
      color: ${props => props.theme.secondaryText};
    }
  }

  td.progress-column {
    min-width: 180px;
    width: 100%;
  }

  td.more-column {
    min-width: 60px;
    max-width: 60px;
  }

  .progress-wrapper {
    font-size: ${props => props.theme.fontSizes.smaller};
    &:hover {
      cursor: pointer;
    }
  }

  .progress {
    background: #555;
    padding: 2px 8px;
    position: relative;
    ${styles.singleLine()};

    &,
    .progress-inner {
      border-radius: 4px;
    }
    & .progress-inner {
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

const ControlButtonsDiv = styled.div`
  padding: 12px;
  padding-top: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Spacer = styled.div`
  width: 8px;
  height: 1px;
`;

@watching
class InstallLocationSettings extends React.Component<Props, State> {
  constructor(props: InstallLocationSettings["props"], context: any) {
    super(props, context);
    this.state = {
      installLocations: [],
    };
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.installLocationsChanged, async (store, action) => {
      this.refresh();
    });
  }

  componentDidMount() {
    this.refresh();
  }

  async refresh() {
    const res = await rcall(messages.InstallLocationsList, {});
    if (res) {
      const { installLocations } = res;
      this.setState({ installLocations });
    }
  }

  render() {
    const { dispatch } = this.props;
    return (
      <>
        <h2>{T(["preferences.install_locations"])}</h2>
        {this.installLocationTable()}

        <ControlButtonsDiv>
          <Button
            icon="plus"
            label={T(["preferences.install_location.add"])}
            onClick={() =>
              dispatch(actions.addInstallLocation({ wind: ambientWind() }))
            }
          />
          <Spacer />
          <Button
            icon="repeat"
            label={T(["preferences.scan_install_locations"])}
            onClick={() => dispatch(actions.scanInstallLocations({}))}
          />
        </ControlButtonsDiv>
      </>
    );
  }

  installLocationTable() {
    const { installLocations } = this.state;
    const { defaultInstallLocation } = this.props;

    let rows: JSX.Element[] = [];
    for (const il of installLocations) {
      const { id } = il;
      const isDefault = id === defaultInstallLocation;

      const { path, sizeInfo } = il;
      const { installedSize, freeSize, totalSize } = sizeInfo!;
      const rowClasses = classNames("install-location-row", {
        ["default"]: isDefault,
      });

      rows.push(
        <tr className={rowClasses} key={`location-${id}`}>
          <td className="path-column">
            {path}
            {isDefault ? (
              <span className="single-line default-state">
                {T(["preferences.install_location.is_default_short"])}
              </span>
            ) : null}
          </td>
          <td className="progress-column">
            {totalSize >= 0 ? (
              <>
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
              </>
            ) : (
              <>Not available</>
            )}
          </td>
          <td className="more-column">
            <IconButton
              className={"more-actions-button"}
              emphasized
              icon="more_vert"
              data-id={id}
              onClick={this.onMoreActions}
            />
          </td>
        </tr>
      );
    }

    rows.push();

    rows.push();

    return (
      <LocationTable>
        <tbody>{rows}</tbody>
      </LocationTable>
    );
  }

  onMoreActions = (e: React.MouseEvent<any>) => {
    e.preventDefault();
    const { id } = e.currentTarget.dataset;
    const installLocations = this.state.installLocations;
    const isDefault = this.props.defaultInstallLocation == id;
    let installLocation = findWhere(installLocations, { id });
    const mayDelete = size(installLocations) > 1;

    let template: MenuTemplate = [];
    template.push({
      localizedLabel: ["preferences.install_location.navigate"],
      action: actions.navigate({
        wind: "root",
        url: urlForInstallLocation(installLocation.id),
      }),
      id: "context--install-location-navigate",
    });

    if (!isDefault) {
      template.push({
        localizedLabel: ["preferences.install_location.make_default_short"],
        action: actions.makeInstallLocationDefault({ id }),
        id: "context--install-location-make-default",
      });
    }

    if (mayDelete) {
      template.push({
        localizedLabel: ["preferences.install_location.delete"],
        action: actions.removeInstallLocation({ id }),
        id: "context--install-location-delete",
      });
    }

    const { dispatch } = this.props;
    dispatch(
      actions.popupContextMenu({
        wind: ambientWind(),
        clientX: e.clientX,
        clientY: e.clientY,
        template,
      })
    );
  };
}

interface Props {
  dispatch: Dispatch;
  defaultInstallLocation: string;
}

interface State {
  installLocations: InstallLocationSummary[];
}

export default hook(map => ({
  defaultInstallLocation: map(rs => rs.preferences.defaultInstallLocation),
}))(InstallLocationSettings);
