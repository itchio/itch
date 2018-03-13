import * as React from "react";
import { connect, actionCreatorsList, Dispatchers } from "../connect";
import format from "../format";

import { size } from "underscore";
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
  }

  .borderless {
    td {
      border: none;
    }
  }

  .action {
    color: white;

    .single-line {
      ${styles.singleLine()};
      display: inline-block;
      max-width: 200px;
    }

    .default-state {
      color: #999;
      margin-left: 8px;
    }

    .icon {
      -webkit-filter: brightness(70%);
    }

    .icon-plus,
    .icon-refresh,
    .icon-stopwatch,
    .icon-folder,
    .icon-star,
    .icon-star2 {
      font-size: 80%;
      margin-right: 8px;
    }

    &:hover {
      .icon {
        -webkit-filter: none;
      }
      cursor: pointer;
    }
  }

  .icon-action {
    padding-left: 0;
    padding-right: 0;

    text-align: center;
  }

  .progress-wrapper {
    font-size: ${props => props.theme.fontSizes.smaller};
    &:hover {
      cursor: pointer;
    }
  }

  .progress {
    background: #555;
    padding: 0.2em 0.4em;
    min-width: 160px;
    position: relative;
    text-align: center;

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
    const { installLocations } = await call(messages.InstallLocationsList, {});
    this.setState({ installLocations });
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
          <td className="action path">
            <span className="single-line">{path}</span>
            {isDefault ? (
              <span className="single-line default-state">
                {format(["preferences.install_location.is_default_short"])}
              </span>
            ) : null}
          </td>
          <td>
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
          </td>
          <td className="action icon-action">
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
          <Icon icon="plus" />
          {format(["preferences.install_location.add"])}
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
    const isDefault = this.props.defaultInstallLocation == id;
    const mayDelete = size(this.state.installLocations) > 1;

    let template: IMenuTemplate = [];
    if (!isDefault) {
      template.push({
        localizedLabel: ["preferences.install_location.make_default_short"],
        action: actions.makeInstallLocationDefault({ id }),
      });
    }
    template.push({
      localizedLabel: ["preferences.install_location.navigate"],
      action: actions.navigate({ url: `itch://locations/${id}` }),
    });

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
