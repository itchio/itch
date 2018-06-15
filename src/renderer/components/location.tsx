import React from "react";

import { MeatProps } from "renderer/components/meats/types";

import { Space } from "common/helpers/space";

import styled, * as styles from "./styles";

import Link from "./basics/link";
import FiltersContainer from "./filters-container";
import { showInExplorerString } from "common/format/show-in-explorer";
import { T } from "renderer/t";
import { actions } from "common/actions";
import { ITabInstance } from "common/types";
import { Dispatch, withDispatch } from "./dispatch-provider";
import { withTabInstance } from "./meats/tab-instance-provider";
import ButlerCall from "./butler-call/butler-call";
import { messages } from "common/butlerd";
import {
  FetchCavesByInstallLocationIDResult,
  InstallLocationsGetByIDResult,
} from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { isEmpty } from "underscore";
import { withTab } from "./meats/tab-provider";
import { rendererWindow, urlForGame } from "common/util/navigation";

const LocationContainer = styled.div`
  ${styles.meat()};

  .list {
    overflow-y: auto;
  }

  .item {
    margin: 8px;
    line-height: 1.6;

    font-size: 120%;
  }

  .info {
    margin: 0 8px;
  }
`;

const InstallLocationsGetByID = ButlerCall(messages.InstallLocationsGetByID);
const FetchCavesByInstallLocationID = ButlerCall(
  messages.FetchCavesByInstallLocationID
);

class Location extends React.PureComponent<Props> {
  render() {
    const { tabInstance } = this.props;

    const installLocationId = Space.fromInstance(
      tabInstance
    ).firstPathElement();

    return (
      <LocationContainer>
        <InstallLocationsGetByID
          params={{ id: installLocationId }}
          onResult={result => {
            if (!(result && result.installLocation)) {
              return;
            }
            const loc = result.installLocation;
            this.props.dispatch(
              actions.tabDataFetched({
                window: rendererWindow(),
                tab: this.props.tab,
                data: {
                  label: `${loc.path}`,
                },
              })
            );
          }}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <FiltersContainer loading={loading}>
                {this.renderLocationInfo(result)}
                <Link
                  label={T(showInExplorerString())}
                  onClick={e =>
                    this.props.dispatch(
                      actions.browseInstallLocation({ id: installLocationId })
                    )
                  }
                />
              </FiltersContainer>
            );
          }}
        />
        <FetchCavesByInstallLocationID
          params={{ installLocationId }}
          render={({ result }) => (
            <div className="list">{this.renderItems(result)}</div>
          )}
        />
      </LocationContainer>
    );
  }

  renderLocationInfo(result: InstallLocationsGetByIDResult) {
    if (!result) {
      return null;
    }

    const { installLocation } = result;
    if (!installLocation) {
      return null;
    }

    return (
      <div className="info">
        {T([
          "install_location.property.size_on_disk",
          { size: fileSize(result.installLocation.sizeInfo.installedSize) },
        ])}
      </div>
    );
  }

  renderItems(result: FetchCavesByInstallLocationIDResult) {
    if (!result) {
      return null;
    }

    const { caves } = result;

    return (
      <>
        {isEmpty(caves)
          ? null
          : caves.map(cave => {
              return (
                <div className="item" key={cave.game.id}>
                  <a href={urlForGame(cave.game.id)}>
                    <h3>{cave.game.title}</h3>
                  </a>
                  <p>{cave.game.shortText}</p>
                </div>
              );
            })}
      </>
    );
  }
}

interface Props extends MeatProps {
  tab: string;
  tabInstance: ITabInstance;
  dispatch: Dispatch;
}

export default withTabInstance(withDispatch(withTab(Location)));
