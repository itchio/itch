import { messages } from "common/butlerd";
import { GameClassification, Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { withProfile } from "renderer/hocs/withProfile";
import { withSpace } from "renderer/hocs/withSpace";
import {
  FilterGroupGameClassification,
  FilterGroupInstalled,
} from "renderer/pages/common/CommonFilters";
import GameSeries from "renderer/pages/common/GameSeries";
import SearchControl from "renderer/pages/common/SearchControl";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const OwnedSeries = GameSeries(messages.FetchProfileOwnedKeys);

class OwnedPage extends React.PureComponent<Props> {
  render() {
    const { space, profile } = this.props;

    return (
      <OwnedSeries
        label={["sidebar.owned"]}
        params={{
          profileId: profile.id,
          limit: 15,
          sortBy: space.queryParam("sortBy"),
          reverse: space.queryParam("sortDir") === "reverse",
          search: space.queryParam("search"),
          filters: {
            classification: space.queryParam(
              "classification"
            ) as GameClassification,
            installed: space.queryParam("installed") === "true",
          },
        }}
        getGame={dk => dk.game}
        renderItemExtras={cave => <StandardMainAction game={cave.game} />}
        renderMainFilters={() => <SearchControl />}
        renderExtraFilters={() => (
          <SortsAndFilters>
            <FilterGroup>
              <SortOption sortBy={"acquiredAt"} label={"Acquired recently"} />
              <SortOption sortBy={"title"} label={"Title"} />
            </FilterGroup>
            <FilterSpacer />
            <FilterGroupInstalled />
            <FilterSpacer />
            <FilterGroupGameClassification />
          </SortsAndFilters>
        )}
      />
    );
  }
}

interface State {
  search: string;
}

interface Props extends MeatProps {
  profile: Profile;
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(withProfile(hook()(OwnedPage)));
