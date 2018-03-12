import * as React from "react";
import { connect, actionCreatorsList, Dispatchers } from "../connect";
import format from "../format";
import { createStructuredSelector, createSelector } from "reselect";
import { IRootState, IInstallLocation } from "../../types/index";

import { each, map, filter } from "underscore";
import * as classNames from "classnames";
import { fileSize } from "../../format/filesize";

import Icon from "../basics/icon";
import * as path from "path";
import diskspace from "../../os/diskspace";

import styled from "../styles";

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

class InstallLocationSettings extends React.PureComponent<
  IProps & IDerivedProps
> {
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

    const installLocations = (this.props.installLocations ||
      {}) as IExtendedInstallLocations;
    const {
      aliases,
      defaultLoc = "appdata",
      locations = [],
    } = installLocations;

    // can't delete your last remaining location.
    const severalLocations = locations.length > 0;

    let rows: JSX.Element[] = [];
    rows.push(header);

    each(locations, location => {
      const { name } = location;
      const isDefault = name === defaultLoc;
      const mayDelete = severalLocations && name !== "appdata";

      let { path } = location;
      for (const alias of aliases) {
        path = path.replace(alias[0], alias[1]);
      }
      const { size, freeSpace } = location;
      const rowClasses = classNames("install-location-row", {
        ["default"]: isDefault,
      });

      rows.push(
        <tr className={rowClasses} key={`location-${name}`}>
          <td
            className="action path"
            onClick={e => makeInstallLocationDefault({ name })}
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
          <td> {fileSize(size)} </td>
          <td> {freeSpace > 0 ? fileSize(freeSpace) : "..."} </td>
          <td
            className="action icon-action install-location-navigate"
            data-rh-at="top"
            data-rh={JSON.stringify(["preferences.install_location.navigate"])}
            onClick={e => {
              e.preventDefault();
              navigate({ url: `itch://locations/${name}` });
            }}
          >
            <Icon icon="arrow-right" />
          </td>

          {mayDelete ? (
            <td
              className="action icon-action delete"
              data-rh-at="top"
              data-rh={JSON.stringify(["preferences.install_location.delete"])}
              onClick={e => removeInstallLocationRequest({ name })}
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
  installLocations: IExtendedInstallLocations;
};

interface IExtendedInstallLocation extends IInstallLocation {
  /** some hardcoded value like 'appData' or an UUID */
  name: string;

  /** total size of installed items in this location */
  size: number;

  /** free disk space in this location */
  freeSpace: number;
}

interface IExtendedInstallLocations {
  aliases: string[][];
  defaultLoc?: string;
  locations: IExtendedInstallLocation[];
}

export default connect<IProps>(InstallLocationSettings, {
  actionCreators,
  state: createStructuredSelector({
    installLocations: createSelector(
      (rs: IRootState) => rs.preferences.installLocations,
      (rs: IRootState) => rs.preferences.defaultInstallLocation,
      (rs: IRootState) => rs.system.homePath,
      (rs: IRootState) => rs.system.userDataPath,
      (rs: IRootState) => rs.system.diskInfo,
      (rs: IRootState) => rs.commons.locationSizes,
      (
        locInfos,
        defaultLoc,
        homePath,
        userDataPath,
        diskInfo,
        locationSizes
      ) => {
        if (!locInfos) {
          return {};
        }

        locInfos = {
          ...locInfos,
          appdata: {
            path: path.join(userDataPath, "apps"),
          },
        };

        const locations = filter(
          map(locInfos, (locInfo, name) => {
            if (locInfo.deleted) {
              return;
            }

            const size = locationSizes[name] || 0;

            return {
              ...locInfo,
              name,
              freeSpace: diskspace.freeInFolder(diskInfo, locInfo.path),
              size,
            };
          }),
          x => !!x
        );

        return {
          locations,
          aliases: [[homePath, "~"]],
          defaultLoc,
        };
      }
    ),
  }),
});
