import { messages } from "common/butlerd";
import { GameClassification, Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { LocalizedString, Dispatch } from "common/types";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { withProfile } from "renderer/hocs/withProfile";
import { withSpace } from "renderer/hocs/withSpace";
import FilterInput from "renderer/pages/common/FilterInput";
import GameSeries from "renderer/pages/common/GameSeries";
import {
  FilterGroup,
  SortsAndFilters,
  FilterSpacer,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { debounce } from "underscore";
import { FilterOption } from "renderer/pages/common/Filter";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroupGameClassification,
  FilterGroupInstalled,
} from "renderer/pages/common/CommonFilters";

const OwnedSeries = GameSeries(messages.FetchProfileOwnedKeys);

class OwnedPage extends React.PureComponent<Props, State> {
  constructor(props: OwnedPage["props"], context: any) {
    super(props, context);
    this.state = {
      search: null,
    };
  }

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
          search: this.state.search,
          filters: {
            classification: space.queryParam(
              "classification"
            ) as GameClassification,
            installed: space.queryParam("installed") === "true",
          },
        }}
        getGame={dk => dk.game}
        renderItemExtras={cave => <StandardMainAction game={cave.game} />}
        renderMainFilters={() => this.renderSearch()}
        renderExtraFilters={() => this.renderExtraFilters()}
      />
    );
  }

  renderSearch(): JSX.Element {
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

  renderExtraFilters(): JSX.Element {
    return (
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
