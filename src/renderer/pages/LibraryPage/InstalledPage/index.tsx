import { messages } from "common/butlerd";
import { GameClassification } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import { FilterGroupGameClassification } from "renderer/pages/common/CommonFilters";
import SearchControl from "renderer/pages/common/SearchControl";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  FilterOptionIcon,
  FilterOptionLink,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import makeGameSeries from "renderer/series/GameSeries";
import { T, _ } from "renderer/t";

const CaveGameSeries = makeGameSeries(messages.FetchCaves);

class InstalledPage extends React.PureComponent<Props> {
  render() {
    const { search, sortBy, sortDir, classification } = this.props;

    return (
      <CaveGameSeries
        label={_("sidebar.installed")}
        params={{
          sortBy,
          reverse: sortDir === "reverse",
          filters: { classification },
          search,
        }}
        getRecord={this.getRecord}
        getKey={this.getKey}
        renderItemExtras={this.renderItemExtras}
        renderMainFilters={this.renderMainFilters}
        renderExtraFilters={this.renderExtraFilters}
      />
    );
  }

  getRecord = CaveGameSeries.getRecordCallback((cave) => cave.game);
  getKey = CaveGameSeries.getKeyCallback((cave) => cave.id);
  renderItemExtras = CaveGameSeries.renderItemExtrasCallback((cave) => (
    <StandardMainAction game={cave.game} />
  ));
  renderMainFilters = () => <SearchControl />;
  renderExtraFilters = () => (
    <SortsAndFilters>
      <FilterGroup>
        <SortOption sortBy="title" label={_("sort_by.games.title")} />
      </FilterGroup>
      <FilterSpacer />
      <FilterGroupGameClassification />
      <FilterSpacer />
      <FilterGroup>
        <FilterOptionLink id="manage-install-locations" href="itch://locations">
          <FilterOptionIcon icon="cog" />
          {T(["install_locations.manage"])}
        </FilterOptionLink>
      </FilterGroup>
    </SortsAndFilters>
  );
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  sortBy: string;
  sortDir: string;
  search: string;
  classification: GameClassification;
}

export default withTab(
  hookWithProps(InstalledPage)((map) => ({
    sortBy: map((rs, props) => ambientTab(rs, props).location.query.sortBy),
    sortDir: map((rs, props) => ambientTab(rs, props).location.query.sortDir),
    search: map((rs, props) => ambientTab(rs, props).location.query.search),
    classification: map(
      (rs, props) =>
        ambientTab(rs, props).location.query
          .classification as GameClassification
    ),
  }))(InstalledPage)
);
