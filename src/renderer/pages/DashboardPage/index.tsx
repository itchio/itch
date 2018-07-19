import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch, LocalizedString } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { withProfile } from "renderer/hocs/withProfile";
import { withSpace } from "renderer/hocs/withSpace";
import GameSeries from "renderer/pages/common/GameSeries";
import Page from "renderer/pages/common/Page";
import SearchControl from "renderer/pages/common/SearchControl";
import {
  FilterGroup,
  SortsAndFilters,
  FilterSpacer,
} from "renderer/pages/common/SortsAndFilters";
import ProfileGameStats from "renderer/pages/DashboardPage/ProfileGameStats";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { SortOption } from "renderer/pages/common/Sort";
import { FilterOption } from "renderer/pages/common/Filter";
import StandardMainAction from "renderer/pages/common/StandardMainAction";

const ProfileGameSeries = GameSeries(messages.FetchProfileGames);

class DashboardPage extends React.PureComponent<Props> {
  render() {
    const { profile, space } = this.props;

    return (
      <Page>
        <ProfileGameSeries
          label={["sidebar.dashboard"]}
          params={{
            profileId: profile.id,
            limit: 15,
            cursor: space.queryParam("cursor"),
            sortBy: space.queryParam("sortBy"),
            reverse: space.queryParam("sortDir") === "reverse",
            search: space.queryParam("search"),
            filters: {
              visibility: space.queryParam("visibility"),
              paidStatus: space.queryParam("paidStatus"),
            },
          }}
          getGame={pg => pg.game}
          renderMainFilters={() => <SearchControl />}
          renderExtraFilters={() => (
            <SortsAndFilters>
              <FilterGroup>
                <SortOption sortBy="title" label={["sort_by.games.title"]} />
                <SortOption sortBy="views" label={["sort_by.games.views"]} />
                <SortOption
                  sortBy="downloads"
                  label={["sort_by.games.downloads"]}
                />
                <SortOption
                  sortBy="purchases"
                  label={["sort_by.games.purchases"]}
                />
              </FilterGroup>
              <FilterSpacer />
              {this.renderVisibilityFilter()}
              <FilterSpacer />
              {this.renderPaidStatusFilter()}
            </SortsAndFilters>
          )}
          renderItemExtras={pg => (
            <>
              <ProfileGameStats pg={pg} />
              <StandardMainAction game={pg.game} />
            </>
          )}
        />
      </Page>
    );
  }

  renderPaidStatusFilter(): JSX.Element {
    return (
      <FilterGroup>
        <FilterOption
          optionKey="paidStatus"
          optionValue="free"
          label={["filter_by.games.paid_status.free"]}
        />
        <FilterOption
          optionKey="paidStatus"
          optionValue="paid"
          label={["filter_by.games.paid_status.paid"]}
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
            label={["filter_by.games.visibility.published"]}
          />
          <FilterOption
            optionKey="visibility"
            optionValue="draft"
            label={["filter_by.games.visibility.draft"]}
          />
        </FilterGroup>
      </>
    );
  }
}

interface Props extends MeatProps {
  profile: Profile;
  space: Space;
  dispatch: Dispatch;
}

export default withProfile(withSpace(hook()(DashboardPage)));
