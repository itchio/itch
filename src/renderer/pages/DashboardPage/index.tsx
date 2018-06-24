import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { LocalizedString } from "common/types";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfile } from "renderer/hocs/withProfile";
import { withSpace } from "renderer/hocs/withSpace";
import FilterInput from "renderer/pages/common/FilterInput";
import GameSeries from "renderer/pages/common/GameSeries";
import Page from "renderer/pages/common/Page";
import {
  SortGroup,
  SortOption,
  SortsAndFilters,
  SortSpacer,
} from "renderer/pages/common/SortsAndFilters";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { debounce } from "underscore";

const ProfileGameSeries = GameSeries(messages.FetchProfileGames);

class DashboardPage extends React.PureComponent<Props, State> {
  constructor(props: DashboardPage["props"], context: any) {
    super(props, context);
    this.state = {
      search: "",
    };
  }

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
            search: this.state.search,
            filters: {
              visibility: space.queryParam("visibility"),
              paidStatus: space.queryParam("paidStatus"),
            },
          }}
          getGame={pg => pg.game}
          renderMainFilters={() => this.renderSearch(space)}
          renderExtraFilters={() => (
            <SortsAndFilters>
              {this.renderSorts(space)}
              <SortSpacer />
              {this.renderVisibilityFilter(space)}
              <SortSpacer />
              {this.renderPaidStatusFilter(space)}
            </SortsAndFilters>
          )}
        />
      </Page>
    );
  }

  renderPaidStatusFilter(sp: Space): JSX.Element {
    return (
      <SortGroup>
        {this.renderPaidStatus(sp, "", "All")}
        {this.renderPaidStatus(sp, "free", "Free")}
        {this.renderPaidStatus(sp, "paid", "Paid")}
      </SortGroup>
    );
  }

  renderPaidStatus(
    sp: Space,
    paidStatus: string,
    label: LocalizedString
  ): JSX.Element {
    return (
      <SortOption
        sp={sp}
        optionKey="paidStatus"
        optionValue={paidStatus}
        icon="coin"
        label={label}
      />
    );
  }

  renderVisibilityFilter(sp: Space): JSX.Element {
    return (
      <>
        <SortGroup>
          {this.renderVisibility(sp, "", "All")}
          {this.renderVisibility(sp, "published", "Published")}
          {this.renderVisibility(sp, "draft", "Draft")}
        </SortGroup>
      </>
    );
  }

  renderVisibility(
    sp: Space,
    visibility: string,
    label: LocalizedString
  ): JSX.Element {
    return (
      <SortOption
        sp={sp}
        optionKey="visibility"
        optionValue={visibility}
        icon="earth"
        label={label}
      />
    );
  }

  renderSorts(sp: Space): JSX.Element {
    return (
      <SortGroup>
        {this.renderSort(sp, "default", "Default")}
        {this.renderSort(sp, "views", "Most views")}
        {this.renderSort(sp, "downloads", "Most downloads")}
        {this.renderSort(sp, "purchases", "Most purchases")}
      </SortGroup>
    );
  }

  renderSort(sp: Space, sortBy: string, label: LocalizedString): JSX.Element {
    return (
      <SortOption
        sp={sp}
        optionKey="sortBy"
        optionValue={sortBy}
        icon="sort-alpha-asc"
        label={label}
      />
    );
  }

  renderSearch(sp: Space): JSX.Element {
    const debouncedSetSearch = debounce(this.setSearch, 250);
    return (
      <FilterInput
        placeholder="Filter..."
        onChange={e => debouncedSetSearch(e.currentTarget.value)}
      />
    );
  }

  setSearch = (search: string) => {
    this.setState({ search });
  };
}

interface Props extends MeatProps {
  profile: Profile;
  space: Space;
  dispatch: Dispatch;
}

interface State {
  search: string;
}

export default withProfile(withSpace(withDispatch(DashboardPage)));
