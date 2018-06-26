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
  SortGroup,
  SortOption,
  SortsAndFilters,
  SortSpacer,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { debounce } from "underscore";

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
        {this.renderSorts()}
        <SortSpacer />
        {this.renderInstalledFilter()}
        <SortSpacer />
        {this.renderClassificationFilter()}
      </SortsAndFilters>
    );
  }

  renderSorts() {
    return (
      <SortGroup>
        {this.renderSort("acquiredAt", "Acquired recently")}
        {this.renderSort("title", "Title")}
      </SortGroup>
    );
  }

  renderSort(sortBy: string, label: LocalizedString): JSX.Element {
    return (
      <SortOption
        optionKey="sortBy"
        optionValue={sortBy}
        icon="sort-alpha-asc"
        label={label}
      />
    );
  }

  renderInstalledFilter() {
    return (
      <SortGroup>
        {this.renderInstalled("", "All")}
        {this.renderInstalled("true", "Installed")}
      </SortGroup>
    );
  }

  renderInstalled(installed: string, label: LocalizedString) {
    return (
      <SortOption
        optionKey="installed"
        optionValue={installed}
        icon="checkmark"
        label={label}
      />
    );
  }

  renderClassificationFilter() {
    return (
      <SortGroup>
        {this.renderClassification("" as GameClassification, "All")}
        {this.renderClassification(GameClassification.Game, "Games")}
        {this.renderClassification(GameClassification.Tool, "Tools")}
        {this.renderClassification(GameClassification.Assets, "Game assets")}
        {this.renderClassification(GameClassification.Comic, "Comic")}
        {this.renderClassification(GameClassification.Book, "Book")}
      </SortGroup>
    );
  }

  renderClassification(
    classification: GameClassification,
    label: LocalizedString
  ) {
    return (
      <SortOption
        optionKey="classification"
        optionValue={classification}
        icon="star"
        label={label}
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
