import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { InstallLocationsGetByIDResult } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { showInExplorerString } from "common/format/show-in-explorer";
import { truncate } from "common/format/truncate";
import { formatUploadTitle } from "common/format/upload";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import GameStatusGetter from "renderer/basics/GameStatusGetter";
import LastPlayed from "renderer/basics/LastPlayed";
import Link from "renderer/basics/Link";
import TotalPlaytime from "renderer/basics/TotalPlaytime";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import Page from "renderer/pages/common/Page";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import makeGameSeries from "renderer/series/GameSeries";
import styled from "renderer/styles";
import { T } from "renderer/t";

const InstallLocationsGetByID = butlerCaller(messages.InstallLocationsGetByID);
const CaveGameSeries = makeGameSeries(messages.FetchCaves);

const ExtrasDiv = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: flex-start;
`;

const SizeDiv = styled.div`
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 260px;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

class LocationPage extends React.PureComponent<Props> {
  render() {
    const { sortBy, sortDir, installLocationId } = this.props;

    return (
      <Page>
        <InstallLocationsGetByID
          params={{ id: installLocationId }}
          onResult={result => {
            if (!(result && result.installLocation)) {
              return;
            }
            const loc = result.installLocation;
            dispatchTabPageUpdate(this.props, { label: `${loc.path}` });
          }}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <CaveGameSeries
                params={{
                  filters: { installLocationId },
                  sortBy,
                  reverse: sortDir === "reverse",
                }}
                getRecord={cave => cave.game}
                getKey={cave => cave.id}
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
                renderExtraFilters={() => (
                  <SortsAndFilters>
                    <FilterGroup>
                      <SortOption
                        sortBy={"title"}
                        label={["sort_by.games.title"]}
                      />
                      <SortOption
                        sortBy={"lastTouched"}
                        label={["sort_by.games.last_touched"]}
                      />
                      <SortOption
                        sortBy={"playTime"}
                        label={["sort_by.games.play_time"]}
                      />
                      <SortOption
                        sortBy={"installedSize"}
                        label={["sort_by.games.size_on_disk"]}
                      />
                      <SortOption
                        sortBy={"installedAt"}
                        label={["sort_by.games.install_date"]}
                      />
                    </FilterGroup>
                  </SortsAndFilters>
                )}
                renderItemExtras={cave => (
                  <>
                    <ExtrasDiv>
                      <FilterSpacer />
                      <div title={formatUploadTitle(cave.upload)}>
                        {truncate(formatUploadTitle(cave.upload), {
                          length: 20,
                        })}
                      </div>
                      <GameStatusGetter
                        game={cave.game}
                        caveId={cave.id}
                        render={status => (
                          <>
                            <TotalPlaytime
                              game={cave.game}
                              cave={status.cave}
                            />
                            <LastPlayed game={cave.game} cave={status.cave} />
                          </>
                        )}
                      />
                      <SizeDiv>
                        {T([
                          "install_location.property.size_on_disk",
                          { size: fileSize(cave.installInfo.installedSize) },
                        ])}
                        <FilterSpacer />
                        <Link
                          label={T(["grid.item.manage"])}
                          onClick={() =>
                            this.props.dispatch(
                              actions.manageCave({
                                caveId: cave.id,
                              })
                            )
                          }
                        />
                      </SizeDiv>
                    </ExtrasDiv>
                    <StandardMainAction game={cave.game} />
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
  tab: string;

  installLocationId: string;
  sortBy: string;
  sortDir: string;
}

export default withTab(
  hookWithProps(LocationPage)(map => ({
    installLocationId: map(
      (rs, props) => ambientTab(rs, props).location.firstPathElement
    ),
    sortBy: map((rs, props) => ambientTab(rs, props).location.query.sortBy),
    sortDir: map((rs, props) => ambientTab(rs, props).location.query.sortDir),
  }))(LocationPage)
);
