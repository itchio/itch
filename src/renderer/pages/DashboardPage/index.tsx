import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { LocalizedString } from "common/types";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfile } from "renderer/hocs/withProfile";
import { withSpace } from "renderer/hocs/withSpace";
import GameSeries from "renderer/pages/common/GameSeries";
import Page from "renderer/pages/common/Page";
import SearchControl from "renderer/pages/common/SearchControl";
import SortControl from "renderer/pages/common/SortControl";
import {
  SortGroup,
  SortOption,
  SortsAndFilters,
  SortSpacer,
} from "renderer/pages/common/SortsAndFilters";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

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
              <SortControl
                sorts={[
                  { value: "default", label: "Default" },
                  { value: "views", label: "Views" },
                  { value: "downloads", label: "Downloads" },
                  { value: "purchases", label: "Purchases" },
                ]}
              />
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
        space={sp}
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
        space={sp}
        optionKey="visibility"
        optionValue={visibility}
        icon="earth"
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

export default withProfile(withSpace(withDispatch(DashboardPage)));
