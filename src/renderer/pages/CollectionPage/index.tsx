import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { GameClassification, Profile } from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import { LocalizedString } from "common/types";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import butlerCaller from "renderer/hocs/butlerCaller";
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

const FetchCollection = butlerCaller(messages.FetchCollection);
const CollectionGameSeries = GameSeries(messages.FetchCollectionGames);

class CollectionPage extends React.PureComponent<Props, State> {
  constructor(props: CollectionPage["props"], context: any) {
    super(props, context);
    this.state = {
      search: null,
    };
  }

  render() {
    const { dispatch, space, profile } = this.props;
    const collectionId = space.firstPathNumber();

    return (
      <>
        <FetchCollection
          params={{
            profileId: profile.id,
            collectionId,
          }}
          loadingHandled
          render={() => null}
          onResult={result => {
            let label = "Collection not found";
            if (result && result.collection) {
              const c = result.collection;
              label = `${c.title} (${c.gamesCount})`;
            }
            dispatch(space.makeFetch({ label }));
          }}
        />

        <CollectionGameSeries
          label={null}
          params={{
            profileId: profile.id,
            collectionId,
            sortBy: space.queryParam("sortBy"),
            search: this.state.search,
            filters: {
              classification: space.queryParam(
                "classification"
              ) as GameClassification,
              installed: space.queryParam("installed") === "true",
            },
          }}
          getGame={cg => cg.game}
          renderItemExtras={cave => <StandardMainAction game={cave.game} />}
          renderMainFilters={() => (
            <>
              <IconButton
                icon="redo"
                hint={["browser.popout"]}
                hintPosition="bottom"
                onClick={this.popOutBrowser}
              />
              {this.renderSearch(space)}
            </>
          )}
          renderExtraFilters={() => this.renderExtraFilters(space)}
        />
      </>
    );
  }

  // TODO: dedup with OwnedPage
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
        {this.renderSort(space, "default", "Default")}
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
        sp={space}
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
        sp={space}
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
        sp={space}
        optionKey="classification"
        optionValue={classification}
        icon="star"
        label={label}
      />
    );
  }

  popOutBrowser = () => {
    const { dispatch, space } = this.props;

    // we don't know the slug, the website will redirect to the proper one
    let url = `${urls.itchio}/c/${space.firstPathNumber()}/hello`;
    dispatch(actions.openInExternalBrowser({ url }));
  };
}

interface State {
  search: string;
}

interface Props extends MeatProps {
  profile: Profile;
  space: Space;
  dispatch: Dispatch;
}

export default withProfile(withSpace(withDispatch(CollectionPage)));
