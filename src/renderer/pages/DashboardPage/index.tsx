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
                <SortOption sortBy="title" label="Title" />
                <SortOption sortBy="views" label="Views" />
                <SortOption sortBy="downloads" label="Downloads" />
                <SortOption sortBy="purchases" label="Purchases" />
              </FilterGroup>
              <FilterSpacer />
              {this.renderVisibilityFilter()}
              <FilterSpacer />
              {this.renderPaidStatusFilter()}
            </SortsAndFilters>
          )}
          renderItemExtras={pg => <ProfileGameStats pg={pg} />}
        />
      </Page>
    );
  }

  renderPaidStatusFilter(): JSX.Element {
    return (
      <FilterGroup>
        {this.renderPaidStatus("free", "Free")}
        {this.renderPaidStatus("paid", "Paid")}
      </FilterGroup>
    );
  }

  renderPaidStatus(paidStatus: string, label: LocalizedString): JSX.Element {
    return (
      <FilterOption
        optionKey="paidStatus"
        optionValue={paidStatus}
        label={label}
      />
    );
  }

  renderVisibilityFilter(): JSX.Element {
    return (
      <>
        <FilterGroup>
          {this.renderVisibility("published", "Published")}
          {this.renderVisibility("draft", "Draft")}
        </FilterGroup>
      </>
    );
  }

  renderVisibility(visibility: string, label: LocalizedString): JSX.Element {
    return (
      <FilterOption
        optionKey="visibility"
        optionValue={visibility}
        label={label}
      />
    );
  }
}

interface Props extends MeatProps {
  profile: Profile;
  space: Space;
  dispatch: Dispatch;
}

export default withProfile(withSpace(hook()(DashboardPage)));
