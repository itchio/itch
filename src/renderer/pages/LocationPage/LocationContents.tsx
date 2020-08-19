import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { InstallLocationSummary } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { showInExplorerString } from "common/format/show-in-explorer";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import Link from "renderer/basics/Link";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import makeGameSeries from "renderer/series/GameSeries";
import { T, _ } from "renderer/t";
import LocationItemExtras from "renderer/pages/LocationPage/LocationItemExtras";

const CaveGameSeries = makeGameSeries(messages.FetchCaves);

class LocationContents extends React.PureComponent<Props> {
  render() {
    const { sortBy, sortDir, location } = this.props;
    if (!location) {
      return "Location not found";
    }

    return (
      <CaveGameSeries
        params={{
          filters: { installLocationId: location.id },
          sortBy,
          reverse: sortDir === "reverse",
        }}
        getRecord={this.getRecord}
        getKey={this.getKey}
        renderMainFilters={this.renderMainFilters}
        renderExtraFilters={this.renderExtraFilters}
        renderItemExtras={this.renderItemExtras}
      />
    );
  }

  getRecord = CaveGameSeries.getRecordCallback((cave) => cave.game);
  getKey = CaveGameSeries.getKeyCallback((cave) => cave.id);
  renderMainFilters = () => {
    const { location } = this.props;
    return (
      <>
        {this.renderLocationInfo()}
        &nbsp; &nbsp;
        <Link label={T(showInExplorerString())} onClick={this.onBrowse} />
      </>
    );
  };
  renderExtraFilters = () => (
    <SortsAndFilters>
      <FilterGroup>
        <SortOption sortBy={"title"} label={_("sort_by.games.title")} />
        <SortOption
          sortBy={"lastTouched"}
          label={_("sort_by.games.last_touched")}
        />
        <SortOption sortBy={"playTime"} label={_("sort_by.games.play_time")} />
        <SortOption
          sortBy={"installedSize"}
          label={_("sort_by.games.size_on_disk")}
        />
        <SortOption
          sortBy={"installedAt"}
          label={_("sort_by.games.install_date")}
        />
      </FilterGroup>
    </SortsAndFilters>
  );
  renderItemExtras = CaveGameSeries.renderItemExtrasCallback((cave) => (
    <LocationItemExtras cave={cave} />
  ));

  onBrowse = () => {
    const { dispatch, location } = this.props;
    dispatch(
      actions.browseInstallLocation({
        id: location.id,
      })
    );
  };

  renderLocationInfo() {
    const { location } = this.props;
    return (
      <div className="info">
        {T([
          "install_location.property.size_on_disk",
          { size: fileSize(location.sizeInfo.installedSize) },
        ])}
      </div>
    );
  }
}

interface Props {
  location: InstallLocationSummary | null;

  tab: string;
  dispatch: Dispatch;

  sortBy: string;
  sortDir: string;
}

export default withTab(
  hookWithProps(LocationContents)((map) => ({
    installLocationId: map(
      (rs, props) => ambientTab(rs, props).location.firstPathElement
    ),
    sortBy: map((rs, props) => ambientTab(rs, props).location.query.sortBy),
    sortDir: map((rs, props) => ambientTab(rs, props).location.query.sortDir),
  }))(LocationContents)
);
