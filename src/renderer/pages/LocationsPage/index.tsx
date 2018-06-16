import { actions } from "common/actions";
import { messages } from "common/butlerd";
import {
  FetchCavesByInstallLocationIDResult,
  InstallLocationsGetByIDResult,
} from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { showInExplorerString } from "common/format/show-in-explorer";
import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import { rendererWindow, urlForGame } from "common/util/navigation";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import Link from "renderer/basics/Link";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { isEmpty } from "underscore";

const LocationDiv = styled.div`
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

const InstallLocationsGetByID = butlerCaller(messages.InstallLocationsGetByID);
const FetchCavesByInstallLocationID = butlerCaller(
  messages.FetchCavesByInstallLocationID
);

class LocationPage extends React.PureComponent<Props> {
  render() {
    const { tabInstance } = this.props;

    const installLocationId = Space.fromInstance(
      tabInstance
    ).firstPathElement();

    return (
      <LocationDiv>
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
      </LocationDiv>
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
  tabInstance: TabInstance;
  dispatch: Dispatch;
}

export default withTabInstance(withDispatch(withTab(LocationPage)));
