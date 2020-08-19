import { messages } from "common/butlerd";
import { GameClassification, Profile } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import { withProfile } from "renderer/hocs/withProfile";
import { withTab } from "renderer/hocs/withTab";
import {
  FilterGroupGameClassification,
  FilterGroupInstalled,
} from "renderer/pages/common/CommonFilters";
import SearchControl from "renderer/pages/common/SearchControl";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import makeGameSeries from "renderer/series/GameSeries";
import { _ } from "renderer/t";

const OwnedSeries = makeGameSeries(messages.FetchProfileOwnedKeys);

class OwnedPage extends React.PureComponent<Props> {
  render() {
    const {
      profile,
      sortBy,
      sortDir,
      search,
      classification,
      installed,
    } = this.props;

    return (
      <OwnedSeries
        label={_("sidebar.owned")}
        params={{
          profileId: profile.id,
          sortBy,
          reverse: sortDir === "reverse",
          search,
          filters: {
            classification,
            installed,
          },
        }}
        getRecord={this.getRecord}
        renderItemExtras={this.renderItemExtras}
        renderMainFilters={this.renderMainFilters}
        renderExtraFilters={this.renderExtraFilters}
      />
    );
  }

  getRecord = OwnedSeries.getRecordCallback((dk) => dk.game);
  renderItemExtras = OwnedSeries.renderItemExtrasCallback((cave) => (
    <StandardMainAction game={cave.game} />
  ));
  renderMainFilters = () => <SearchControl />;
  renderExtraFilters = () => (
    <SortsAndFilters>
      <FilterGroup>
        <SortOption
          sortBy={"acquiredAt"}
          label={_("sort_by.games.acquired_at")}
        />
        <SortOption sortBy={"title"} label={_("sort_by.games.title")} />
      </FilterGroup>
      <FilterSpacer />
      <FilterGroupInstalled />
      <FilterSpacer />
      <FilterGroupGameClassification />
    </SortsAndFilters>
  );
}

interface State {
  search: string;
}

interface Props extends MeatProps {
  profile: Profile;
  tab: string;
  dispatch: Dispatch;

  sortBy: string;
  sortDir: string;
  search: string;
  classification: GameClassification;
  installed: boolean;
}

export default withTab(
  withProfile(
    hookWithProps(OwnedPage)((map) => ({
      sortBy: map((rs, props) => ambientTab(rs, props).location.query.sortBy),
      sortDir: map((rs, props) => ambientTab(rs, props).location.query.sortDir),
      search: map((rs, props) => ambientTab(rs, props).location.query.search),
      classification: map(
        (rs, props) =>
          ambientTab(rs, props).location.query
            .classification as GameClassification
      ),
      installed: map(
        (rs, props) => ambientTab(rs, props).location.query.installed === "true"
      ),
    }))(OwnedPage)
  )
);
