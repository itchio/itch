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
              {this.renderVisibilityFilter()}
              <SortSpacer />
              {this.renderPaidStatusFilter()}
            </SortsAndFilters>
          )}
        />
      </Page>
    );
  }

  renderPaidStatusFilter(): JSX.Element {
    return (
      <SortGroup>
        {this.renderPaidStatus("", "All")}
        {this.renderPaidStatus("free", "Free")}
        {this.renderPaidStatus("paid", "Paid")}
      </SortGroup>
    );
  }

  renderPaidStatus(paidStatus: string, label: LocalizedString): JSX.Element {
    return (
      <SortOption
        optionKey="paidStatus"
        optionValue={paidStatus}
        icon="coin"
        label={label}
      />
    );
  }

  renderVisibilityFilter(): JSX.Element {
    return (
      <>
        <SortGroup>
          {this.renderVisibility("", "All")}
          {this.renderVisibility("published", "Published")}
          {this.renderVisibility("draft", "Draft")}
        </SortGroup>
      </>
    );
  }

  renderVisibility(visibility: string, label: LocalizedString): JSX.Element {
    return (
      <SortOption
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
