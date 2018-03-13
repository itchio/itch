import * as React from "react";
import { connect, actionCreatorsList, Dispatchers } from "../connect";
import format from "../format";

import { each, size } from "underscore";
import * as classNames from "classnames";
import { fileSize } from "../../format/filesize";

import Icon from "../basics/icon";

import styled from "../styles";
import { InstallLocationSummary } from "../../buse/messages";
import { messages, withButlerClient } from "../../buse/index";

import rootLogger from "../../logger";
import { IRootState } from "../../types/index";
const logger = rootLogger.child({ name: "install-location-settings" });

const LocationTable = styled.table`
  width: 100%;
  font-size: 14px;
  border-collapse: collapse;
  background-color: $explanation-color;

  td {
    padding: 10px 15px;
    text-align: left;

    &:first-child {
      @include pref-chunk;
    }
  }

  tr.default {
    td {
      &:first-child {
        @include pref-chunk-active;
      }
    }
  }

  tr.header {
    td {
      background: $pref-border-color;
      color: $base-text-color;
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
      @include single-line;
      width: 100%;
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
`;

class InstallLocationSettings extends React.Component<
  IProps & IDerivedProps,
  IState
> {
  state = {
    installLocations: [],
  };

  componentDidMount() {
    this.refresh();
  }

  async refresh() {
    const { installLocations } = await withButlerClient(
      logger,
      async client => {
        return await client.call(messages.InstallLocationsList({}));
      }
    );
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
    const {
      navigate,
      addInstallLocationRequest,
      removeInstallLocationRequest,
      makeInstallLocationDefault,
    } = this.props;

    const header = (
      <tr key="header" className="header">
        <td>{format(["preferences.install_location.path"])}</td>
        <td>{format(["preferences.install_location.used_space"])}</td>
        <td>{format(["preferences.install_location.free_space"])}</td>
        <td />
        <td />
      </tr>
    );

    const { installLocations } = this.state;
    const { defaultInstallLocation } = this.props;

    // cannot delete your last remaining location.
    const severalLocations = size(installLocations) > 1;

    let rows: JSX.Element[] = [];
    rows.push(header);

    each(installLocations, il => {
      const { id } = il;
      const isDefault = id === defaultInstallLocation;
      const mayDelete = severalLocations && id !== "appdata";

      const { path, installedSize, freeSize } = il;
      const rowClasses = classNames("install-location-row", {
        ["default"]: isDefault,
      });

      rows.push(
        <tr className={rowClasses} key={`location-${id}`}>
          <td
            className="action path"
            onClick={e => makeInstallLocationDefault({ name: id })}
          >
            <div
              className="default-switch"
              data-rh-at="right"
              data-rh={JSON.stringify([
                "preferences.install_location." +
                  (isDefault ? "is_default" : "make_default"),
              ])}
            >
              <span className="single-line">{path}</span>
              {isDefault ? (
                <span className="single-line default-state">
                  {format(["preferences.install_location.is_default_short"])}
                </span>
              ) : null}
            </div>
          </td>
          <td> {fileSize(installedSize)} </td>
          <td> {freeSize > 0 ? fileSize(freeSize) : "..."} </td>
          <td
            className="action icon-action install-location-navigate"
            data-rh-at="top"
            data-rh={JSON.stringify(["preferences.install_location.navigate"])}
            onClick={e => {
              e.preventDefault();
              navigate({ url: `itch://locations/${id}` });
            }}
          >
            <Icon icon="arrow-right" />
          </td>

          {mayDelete ? (
            <td
              className="action icon-action delete"
              data-rh-at="top"
              data-rh={JSON.stringify(["preferences.install_location.delete"])}
              onClick={e => removeInstallLocationRequest({ name: id })}
            >
              <Icon icon="cross" />
            </td>
          ) : (
            <td />
          )}
        </tr>
      );
    });

    rows.push(
      <tr key="add-new">
        <td
          className="action add-new"
          onClick={e => {
            e.preventDefault();
            addInstallLocationRequest({});
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
}

interface IProps {}

const actionCreators = actionCreatorsList(
  "updatePreferences",
  "addInstallLocationRequest",
  "removeInstallLocationRequest",
  "makeInstallLocationDefault",
  "navigate"
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
