import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import {
  Collection,
  GameClassification,
  Profile,
} from "common/butlerd/messages";
import urls from "common/constants/urls";
import { classificationFromQuery } from "common/helpers/classification-from-query";
import { Dispatch, MenuTemplate } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import MoreMenuButton from "renderer/pages/common/MoreMenuButton";
import butlerCaller, { renderNoop } from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withProfile } from "renderer/hocs/withProfile";
import { withTab } from "renderer/hocs/withTab";
import {
  FilterGroupGameClassification,
  FilterGroupPlatform,
} from "renderer/pages/common/CommonFilters";
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
import modals from "renderer/modals";

const FetchCollection = butlerCaller(messages.FetchCollection);
const CollectionGameSeries = makeGameSeries(messages.FetchCollectionGames);

interface State {
  collection: Collection | null;
}

class CollectionPage extends React.PureComponent<Props, State> {
  override state: State = { collection: null };

  override componentDidUpdate(prevProps: Props) {
    if (prevProps.collectionId !== this.props.collectionId) {
      this.setState({ collection: null });
    }
  }

  override render() {
    const {
      profile,
      collectionId,
      sortBy,
      sortDir,
      search,
      filterClassification,
      filterInstalled,
      filterPlatform,
    } = this.props;

    if (collectionId === undefined) {
      // the tab has no parsed location (yet)
      return null;
    }

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
          params={{
            profileId: profile.id,
            collectionId,
            sortBy: sortBy,
            reverse: sortDir === "reverse",
            search: search,
            filters: {
              classification: filterClassification,
              installed: filterInstalled,
              platform: filterPlatform,
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
  renderMainFilters = () => {
    const { collectionId, profile, tab } = this.props;
    const { collection } = this.state;
    // we don't know the slug, the website will redirect to the proper one
    const url = `${urls.itchio}/c/${collectionId}/hello`;
    const template: MenuTemplate = [
      {
        localizedLabel: ["browser.popout"],
        action: actions.openInExternalBrowser({ url }),
      },
    ];
    if (
      collection &&
      collection.id === collectionId &&
      collection.userId === profile.user.id
    ) {
      template.push(
        { type: "separator" },
        {
          localizedLabel: ["collection.menu.edit"],
          action: actions.openModal(
            modals.editCollection.make({
              wind: "root",
              title: ["collection.edit.title"],
              message: "",
              widgetParams: { collection, tab },
            })
          ),
        },
        {
          localizedLabel: ["collection.menu.delete"],
          action: actions.requestCollectionDelete({
            collectionId: collection.id,
            tab,
          }),
        }
      );
    }
    return (
      <>
        <SearchControl />
        <MoreMenuButton template={template} />
      </>
    );
  };

  onFetchedCollection = FetchCollection.onResultCallback((result) => {
    let label = "Collection not found";
    const collection = result?.collection ?? null;
    if (collection) {
      label = `${collection.title} (${collection.gamesCount})`;
    }
    this.setState({ collection });
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
        <FilterGroupPlatform />
        <FilterSpacer />
        <FilterGroupGameClassification />
      </SortsAndFilters>
    );
  };
}

interface Props extends MeatProps {
  tab: string;
  profile: Profile;
  dispatch: Dispatch;

  collectionId: number | undefined;
  sortBy: string | undefined;
  sortDir: string | undefined;
  search: string | undefined;
  filterClassification: GameClassification | undefined;
  filterInstalled: boolean;
  filterPlatform: string | undefined;
}

const hooked = hookWithProps(CollectionPage)((map) => ({
  collectionId: map(
    (rs, props) => ambientTab(rs, props).location?.firstPathNumber
  ),
  sortBy: map((rs, props) => ambientTab(rs, props).location?.query.sortBy),
  sortDir: map((rs, props) => ambientTab(rs, props).location?.query.sortDir),
  search: map((rs, props) => ambientTab(rs, props).location?.query.search),
  filterClassification: map((rs, props) =>
    classificationFromQuery(
      ambientTab(rs, props).location?.query.classification
    )
  ),
  filterInstalled: map(
    (rs, props) => ambientTab(rs, props).location?.query.installed === "true"
  ),
  filterPlatform: map(
    (rs, props) => ambientTab(rs, props).location?.query.platform
  ),
}))(CollectionPage);
export default withProfile(withTab(hooked));
