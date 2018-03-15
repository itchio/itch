import * as React from "react";
import { connect, actionCreatorsList, Dispatchers } from "../connect";
import format from "../format";

import { size, findWhere } from "underscore";
import * as classNames from "classnames";
import { fileSize } from "../../format/filesize";

import Icon from "../basics/icon";
import IconButton from "../basics/icon-button";

import styled, * as styles from "../styles";
import { InstallLocationSummary } from "../../buse/messages";
import { messages, call } from "../../buse/index";

import { IRootState, IMenuTemplate } from "../../types/index";
import { actions } from "../../actions/index";
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

  tr.add-new td {
    padding: 10px 15px;
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

  tr.add-new:hover {
    cursor: pointer;
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

class InstallLocationSettings extends React.Component<
  IProps & IDerivedProps,
  IState
> {
  constructor() {
    super();
    this.state = {
      installLocations: [],
    };
  }

  componentDidMount() {
    this.refresh();
  }

  async refresh() {
    const res = await call(messages.InstallLocationsList);
    if (res) {
      const { installLocations } = res;
      this.setState({ installLocations });
    }
  }

  render() {
    return (
      <>
        <h2>{format(["preferences.install_locations"])}</h2>
        {this.installLocationTable()}
      </>
    );
  }

  installLocationTable() {
    const { addInstallLocation } = this.props;

    const { installLocations } = this.state;
    const { defaultInstallLocation } = this.props;

    let rows: JSX.Element[] = [];
    for (const il of installLocations) {
      const { id } = il;
      const isDefault = id === defaultInstallLocation;

      const { path, sizeInfo } = il;
      const { installedSize, freeSize, totalSize } = sizeInfo;
      const rowClasses = classNames("install-location-row", {
        ["default"]: isDefault,
      });

      rows.push(
        <tr className={rowClasses} key={`location-${id}`}>
          <td className="path-column">
            {path}
            {isDefault ? (
              <span className="single-line default-state">
                {format(["preferences.install_location.is_default_short"])}
              </span>
            ) : null}
          </td>
          <td className="progress-column">
            {totalSize >= 0 ? (
              <>
                <div
                  className="progress-wrapper"
                  data-rh={`${fileSize(installedSize)} used by games`}
                >
                  <div className="progress">
                    <div
                      className="progress-inner"
                      style={{
                        right: `${freeSize / totalSize * 100}%`,
                      }}
                    />
                    <span className="progress-label">
                      {fileSize(freeSize)} free of {fileSize(totalSize)}
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
              emphasized
              icon="more_vert"
              data-id={id}
              onClick={this.onMoreActions}
            />
          </td>
        </tr>
      );
    }

    rows.push(
      <tr key="add-new" className="add-new">
        <td
          colSpan={3}
          className="action add-new"
          onClick={e => {
            e.preventDefault();
            addInstallLocation({});
          }}
        >
          <Icon icon="plus" /> {format(["preferences.install_location.add"])}
        </td>
      </tr>
    );

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

    let template: IMenuTemplate = [];
    template.push({
      localizedLabel: ["preferences.install_location.navigate"],
      action: actions.navigateToInstallLocation({ installLocation }),
    });

    if (!isDefault) {
      template.push({
        localizedLabel: ["preferences.install_location.make_default_short"],
        action: actions.makeInstallLocationDefault({ id }),
      });
    }

    if (mayDelete) {
      template.push({
        localizedLabel: ["preferences.install_location.delete"],
        action: actions.removeInstallLocation({ id }),
      });
    }

    // TODO: disable some of these
    this.props.popupContextMenu({
      clientX: e.clientX,
      clientY: e.clientY,
      template,
    });
  };
}

interface IProps {}

const actionCreators = actionCreatorsList(
  "popupContextMenu",
  "updatePreferences",
  "addInstallLocation"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  defaultInstallLocation: string;
};

interface IState {
  installLocations: InstallLocationSummary[];
}

export default connect<IProps>(InstallLocationSettings, {
  actionCreators,
  state: (rs: IRootState) => ({
    defaultInstallLocation: rs.preferences.defaultInstallLocation,
  }),
});
