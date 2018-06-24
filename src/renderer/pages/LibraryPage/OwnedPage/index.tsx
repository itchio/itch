import { messages } from "common/butlerd";
import { GameClassification, Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { LocalizedString } from "common/types";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
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
        renderMainFilters={() => this.renderSearch(space)}
        renderExtraFilters={() => this.renderExtraFilters(space)}
      />
    );
  }

  renderSearch(space: Space): JSX.Element {
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

  renderExtraFilters(space: Space): JSX.Element {
    return (
      <SortsAndFilters>
        {this.renderSorts(space)}
        <SortSpacer />
        {this.renderInstalledFilter(space)}
        <SortSpacer />
        {this.renderClassificationFilter(space)}
      </SortsAndFilters>
    );
  }

  renderSorts(space: Space) {
    return (
      <SortGroup>
        {this.renderSort(space, "acquiredAt", "Acquired recently")}
        {this.renderSort(space, "title", "Title")}
      </SortGroup>
    );
  }

  renderSort(
    space: Space,
    sortBy: string,
    label: LocalizedString
  ): JSX.Element {
    return (
      <SortOption
        space={space}
        optionKey="sortBy"
        optionValue={sortBy}
        icon="sort-alpha-asc"
        label={label}
      />
    );
  }

  renderInstalledFilter(space: Space) {
    return (
      <SortGroup>
        {this.renderInstalled(space, "", "All")}
        {this.renderInstalled(space, "true", "Installed")}
      </SortGroup>
    );
  }

  renderInstalled(space: Space, installed: string, label: LocalizedString) {
    return (
      <SortOption
        space={space}
        optionKey="installed"
        optionValue={installed}
        icon="checkmark"
        label={label}
      />
    );
  }

  renderClassificationFilter(space: Space) {
    return (
      <SortGroup>
        {this.renderClassification(space, "" as GameClassification, "All")}
        {this.renderClassification(space, GameClassification.Game, "Games")}
        {this.renderClassification(space, GameClassification.Tool, "Tools")}
        {this.renderClassification(
          space,
          GameClassification.Assets,
          "Game assets"
        )}
        {this.renderClassification(space, GameClassification.Comic, "Comic")}
        {this.renderClassification(space, GameClassification.Book, "Book")}
      </SortGroup>
    );
  }

  renderClassification(
    space: Space,
    classification: GameClassification,
    label: LocalizedString
  ) {
    return (
      <SortOption
        space={space}
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

export default withSpace(withProfile(withDispatch(OwnedPage)));
