import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { TabInstance, LocalizedString } from "common/types";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import GameSeries from "renderer/pages/common/GameSeries";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { debounce } from "underscore";
import FilterInput from "renderer/pages/common/FilterInput";
import {
  SortsAndFilters,
  SortGroup,
  SortOption,
  SortSpacer,
} from "renderer/pages/common/SortsAndFilters";
import { GameClassification } from "common/butlerd/messages";

const OwnedSeries = GameSeries(messages.FetchProfileOwnedKeys);

class OwnedPage extends React.PureComponent<Props, State> {
  constructor(props: OwnedPage["props"], context: any) {
    super(props, context);
    this.state = {
      search: null,
    };
  }

  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <OwnedSeries
        label={["sidebar.owned"]}
        params={{
          profileId,
          limit: 15,
          sortBy: sp.queryParam("sortBy"),
          cursor: sp.queryParam("cursor"),
          search: this.state.search,
          filters: {
            classification: sp.queryParam(
              "classification"
            ) as GameClassification,
            installed: sp.queryParam("installed") === "true",
          },
        }}
        getGame={dk => dk.game}
        renderItemExtras={cave => <StandardMainAction game={cave.game} />}
        renderMainFilters={() => this.renderSearch(sp)}
        renderExtraFilters={() => this.renderExtraFilters(sp)}
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

  renderExtraFilters(sp: Space): JSX.Element {
    return (
      <SortsAndFilters>
        {this.renderSorts(sp)}
        <SortSpacer />
        {this.renderInstalledFilter(sp)}
        <SortSpacer />
        {this.renderClassificationFilter(sp)}
      </SortsAndFilters>
    );
  }

  renderSorts(sp: Space) {
    return (
      <SortGroup>
        {this.renderSort(sp, "acquiredAt", "Acquired recently")}
        {this.renderSort(sp, "title", "Title")}
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

  renderInstalledFilter(sp: Space) {
    return (
      <SortGroup>
        {this.renderInstalled(sp, "", "All")}
        {this.renderInstalled(sp, "true", "Installed")}
      </SortGroup>
    );
  }

  renderInstalled(sp: Space, installed: string, label: LocalizedString) {
    return (
      <SortOption
        sp={sp}
        optionKey="installed"
        optionValue={installed}
        icon="checkmark"
        label={label}
      />
    );
  }

  renderClassificationFilter(sp: Space) {
    return (
      <SortGroup>
        {this.renderClassification(sp, "" as GameClassification, "All")}
        {this.renderClassification(sp, GameClassification.Game, "Games")}
        {this.renderClassification(sp, GameClassification.Tool, "Tools")}
        {this.renderClassification(
          sp,
          GameClassification.Assets,
          "Game assets"
        )}
        {this.renderClassification(sp, GameClassification.Comic, "Comic")}
        {this.renderClassification(sp, GameClassification.Book, "Book")}
      </SortGroup>
    );
  }

  renderClassification(
    sp: Space,
    classification: GameClassification,
    label: LocalizedString
  ) {
    return (
      <SortOption
        sp={sp}
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
  tab: string;
  profileId: number;
  dispatch: Dispatch;
  tabInstance: TabInstance;
}

export default withTab(withProfileId(withTabInstance(withDispatch(OwnedPage))));
