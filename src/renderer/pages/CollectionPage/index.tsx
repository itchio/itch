import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { GameClassification, Profile } from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import butlerCaller, { renderNoop } from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withProfile } from "renderer/hocs/withProfile";
import { withTab } from "renderer/hocs/withTab";
import { FilterGroupGameClassification } from "renderer/pages/common/CommonFilters";
import { FilterOption } from "renderer/pages/common/Filter";
import SearchControl from "renderer/pages/common/SearchControl";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import makeGameSeries from "renderer/series/GameSeries";
import { _ } from "renderer/t";

const FetchCollection = butlerCaller(messages.FetchCollection);
const CollectionGameSeries = makeGameSeries(messages.FetchCollectionGames);

class CollectionPage extends React.PureComponent<Props> {
  render() {
    const {
      profile,
      collectionId,
      sortBy,
      sortDir,
      search,
      filterClassification,
      filterInstalled,
    } = this.props;

    return (
      <>
        <FetchCollection
          params={{
            profileId: profile.id,
            collectionId,
          }}
          loadingHandled
          render={renderNoop}
          onResult={this.onFetchedCollection}
        />

        <CollectionGameSeries
          label={null}
          params={{
            profileId: profile.id,
            collectionId,
            sortBy: sortBy,
            reverse: sortDir === "reverse",
            search: search,
            filters: {
              classification: filterClassification,
              installed: filterInstalled,
            },
          }}
          getRecord={this.getRecord}
          renderItemExtras={this.renderItemExtras}
          renderMainFilters={this.renderMainFilters}
          renderExtraFilters={this.renderExtraFilters}
        />
      </>
    );
  }

  getRecord = CollectionGameSeries.getRecordCallback((cg) => cg.game);
  renderItemExtras = CollectionGameSeries.renderItemExtrasCallback((cave) => (
    <StandardMainAction game={cave.game} />
  ));
  renderMainFilters = () => (
    <>
      <IconButton
        icon="redo"
        hint={_("browser.popout")}
        hintPosition="bottom"
        onClick={this.popOutBrowser}
      />
      <SearchControl />
    </>
  );

  onFetchedCollection = FetchCollection.onResultCallback((result) => {
    let label = "Collection not found";
    if (result && result.collection) {
      const c = result.collection;
      label = `${c.title} (${c.gamesCount})`;
    }
    dispatchTabPageUpdate(this.props, { label });
  });

  renderExtraFilters = (): JSX.Element => {
    return (
      <SortsAndFilters>
        <FilterGroup>
          <SortOption sortBy="title" label={_("sort_by.games.title")} />
        </FilterGroup>
        <FilterSpacer />
        <FilterGroup>
          <FilterOption
            optionKey="installed"
            optionValue="true"
            label={_("filter_by.games.status.installed")}
          />
        </FilterGroup>
        <FilterSpacer />
        <FilterGroupGameClassification />
      </SortsAndFilters>
    );
  };

  popOutBrowser = () => {
    const { dispatch, collectionId } = this.props;

    // we don't know the slug, the website will redirect to the proper one
    let url = `${urls.itchio}/c/${collectionId}/hello`;
    dispatch(actions.openInExternalBrowser({ url }));
  };
}

interface Props extends MeatProps {
  tab: string;
  profile: Profile;
  dispatch: Dispatch;

  collectionId: number;
  sortBy: string;
  sortDir: string;
  search: string;
  filterClassification: GameClassification;
  filterInstalled: boolean;
}

const hooked = hookWithProps(CollectionPage)((map) => ({
  collectionId: map(
    (rs, props) => ambientTab(rs, props).location.firstPathNumber
  ),
  sortBy: map((rs, props) => ambientTab(rs, props).location.query.sortBy),
  sortDir: map((rs, props) => ambientTab(rs, props).location.query.sortDir),
  search: map((rs, props) => ambientTab(rs, props).location.query.search),
  filterClassification: map(
    (rs, props) => ambientTab(rs, props).location.query.classification
  ),
  filterInstalled: map(
    (rs, props) => !!ambientTab(rs, props).location.query.installed
  ),
}))(CollectionPage);
export default withProfile(withTab(hooked));
