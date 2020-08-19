import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import { withProfile } from "renderer/hocs/withProfile";
import { withTab } from "renderer/hocs/withTab";
import { FilterOption } from "renderer/pages/common/Filter";
import Page from "renderer/pages/common/Page";
import SearchControl from "renderer/pages/common/SearchControl";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import ProfileGameStats from "renderer/pages/DashboardPage/ProfileGameStats";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import makeGameSeries from "renderer/series/GameSeries";
import { _ } from "renderer/t";

const ProfileGameSeries = makeGameSeries(messages.FetchProfileGames);

class DashboardPage extends React.PureComponent<Props> {
  render() {
    const {
      profile,
      sortBy,
      sortDir,
      search,
      visibility,
      paidStatus,
    } = this.props;

    return (
      <Page>
        <ProfileGameSeries
          label={_("sidebar.dashboard")}
          params={{
            profileId: profile.id,
            sortBy,
            reverse: sortDir === "reverse",
            search,
            filters: {
              visibility,
              paidStatus,
            },
          }}
          getRecord={this.getRecord}
          renderMainFilters={this.renderMainFilters}
          renderExtraFilters={this.renderExtraFilters}
          renderItemExtras={this.renderItemExtras}
        />
      </Page>
    );
  }

  getRecord = ProfileGameSeries.getRecordCallback((pg) => pg.game);
  renderMainFilters = () => <SearchControl />;
  renderExtraFilters = () => (
    <SortsAndFilters>
      <FilterGroup>
        <SortOption sortBy="title" label={_("sort_by.games.title")} />
        <SortOption sortBy="views" label={_("sort_by.games.views")} />
        <SortOption sortBy="downloads" label={_("sort_by.games.downloads")} />
        <SortOption sortBy="purchases" label={_("sort_by.games.purchases")} />
      </FilterGroup>
      <FilterSpacer />
      {this.renderVisibilityFilter()}
      <FilterSpacer />
      {this.renderPaidStatusFilter()}
    </SortsAndFilters>
  );
  renderItemExtras = ProfileGameSeries.renderItemExtrasCallback((pg) => (
    <>
      <ProfileGameStats pg={pg} />
      <StandardMainAction game={pg.game} />
    </>
  ));

  renderPaidStatusFilter(): JSX.Element {
    return (
      <FilterGroup>
        <FilterOption
          optionKey="paidStatus"
          optionValue="free"
          label={_("filter_by.games.paid_status.free")}
        />
        <FilterOption
          optionKey="paidStatus"
          optionValue="paid"
          label={_("filter_by.games.paid_status.paid")}
        />
      </FilterGroup>
    );
  }

  renderVisibilityFilter(): JSX.Element {
    return (
      <>
        <FilterGroup>
          <FilterOption
            optionKey="visibility"
            optionValue="published"
            label={_("filter_by.games.visibility.published")}
          />
          <FilterOption
            optionKey="visibility"
            optionValue="draft"
            label={_("filter_by.games.visibility.draft")}
          />
        </FilterGroup>
      </>
    );
  }
}

interface Props extends MeatProps {
  profile: Profile;
  tab: string;
  dispatch: Dispatch;

  sortBy: string;
  sortDir: string;
  search: string;
  visibility: string;
  paidStatus: string;
}

export default withProfile(
  withTab(
    hookWithProps(DashboardPage)((map) => ({
      sortBy: map((rs, props) => ambientTab(rs, props).location.query.sortBy),
      sortDir: map((rs, props) => ambientTab(rs, props).location.query.sortDir),
      search: map((rs, props) => ambientTab(rs, props).location.query.search),
      visibility: map(
        (rs, props) => ambientTab(rs, props).location.query.visibility
      ),
      paidStatus: map(
        (rs, props) => ambientTab(rs, props).location.query.paidStatus
      ),
    }))(DashboardPage)
  )
);
