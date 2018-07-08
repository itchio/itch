import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { GameClassification, Profile } from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import { Dispatch, LocalizedString } from "common/types";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import butlerCaller from "renderer/hocs/butlerCaller";
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
import { SortOption } from "renderer/pages/common/Sort";
import { FilterOption } from "renderer/pages/common/Filter";
import { FilterGroupGameClassification } from "renderer/pages/common/CommonFilters";

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
            reverse: space.queryParam("sortDir") === "reverse",
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
        <FilterGroup>
          <SortOption sortBy="title" label="Title" />
        </FilterGroup>
        <FilterSpacer />
        <FilterGroup>
          <FilterOption
            optionKey="installed"
            optionValue="true"
            label="Installed"
          />
        </FilterGroup>
        <FilterSpacer />
        <FilterGroupGameClassification />
      </SortsAndFilters>
    );
  }

  renderClassificationFilter() {
    return <FilterGroup />;
  }

  renderClassification(
    classification: GameClassification,
    label: LocalizedString
  ) {
    return (
      <FilterOption
        optionKey="classification"
        optionValue={classification}
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

export default withProfile(withSpace(hook()(CollectionPage)));
