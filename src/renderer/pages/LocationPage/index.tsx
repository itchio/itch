import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { InstallLocationsGetByIDResult } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { showInExplorerString } from "common/format/show-in-explorer";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import React from "react";
import Link from "renderer/basics/Link";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import GameSeries from "renderer/pages/common/GameSeries";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { T } from "renderer/t";
import { SortSpacer } from "renderer/pages/common/SortsAndFilters";

const InstallLocationsGetByID = butlerCaller(messages.InstallLocationsGetByID);
const CaveGameSeries = GameSeries(messages.FetchCaves);

class LocationPage extends React.PureComponent<Props> {
  render() {
    const { space, dispatch } = this.props;

    const installLocationId = space.firstPathElement();

    return (
      <Page>
        <InstallLocationsGetByID
          params={{ id: installLocationId }}
          onResult={result => {
            if (!(result && result.installLocation)) {
              return;
            }
            const loc = result.installLocation;
            dispatch(space.makeFetch({ label: `${loc.path}` }));
          }}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <CaveGameSeries
                params={{ filters: { installLocationId } }}
                getGame={cave => cave.game}
                renderMainFilters={() => (
                  <>
                    {this.renderLocationInfo(result)}
                    &nbsp; &nbsp;
                    <Link
                      label={T(showInExplorerString())}
                      onClick={e =>
                        this.props.dispatch(
                          actions.browseInstallLocation({
                            id: installLocationId,
                          })
                        )
                      }
                    />
                  </>
                )}
              />
            );
          }}
        />
      </Page>
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
}

interface Props extends MeatProps {
  dispatch: Dispatch;
  space: Space;
}

export default withSpace(hook()(LocationPage));
