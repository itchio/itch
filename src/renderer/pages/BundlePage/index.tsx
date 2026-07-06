import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
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
import { findWhere } from "underscore";

const FetchProfileOwnedBundles = butlerCaller(
  messages.FetchProfileOwnedBundles
);
const BundleGameSeries = makeGameSeries(messages.FetchBundleGames);

class BundlePage extends React.PureComponent<Props> {
  override render() {
    const {
      profile,
      bundleId,
      sortBy,
      sortDir,
      search,
      filterClassification,
      filterInstalled,
    } = this.props;

    return (
      <>
        <FetchProfileOwnedBundles
          params={{ profileId: profile.id, limit: 100 }}
          loadingHandled
          render={renderNoop}
          onResult={this.onFetchedBundles}
        />

        <BundleGameSeries
          label={null}
          params={{
            profileId: profile.id,
            bundleId,
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

  getRecord = BundleGameSeries.getRecordCallback((bg) => bg.game);
  renderItemExtras = BundleGameSeries.renderItemExtrasCallback((bg) => (
    <StandardMainAction game={bg.game} forceOwned />
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

  onFetchedBundles = FetchProfileOwnedBundles.onResultCallback((result) => {
    const { bundleId } = this.props;
    let label = "Bundle not found";
    const bundleKey = findWhere(result ? result.items : [], { bundleId });
    if (bundleKey && bundleKey.bundle) {
      const b = bundleKey.bundle;
      label = `${b.title} (${b.gamesCount})`;
    }
    dispatchTabPageUpdate(this.props, { label });
  });

  popOutBrowser = () => {
    const { dispatch, bundleId } = this.props;

    // we don't know the slug, the website will redirect to the proper one
    let url = `${urls.itchio}/b/${bundleId}/hello`;
    dispatch(actions.openInExternalBrowser({ url }));
  };
}

interface Props extends MeatProps {
  tab: string;
  profile: Profile;
  dispatch: Dispatch;

  bundleId: number;
  sortBy: string;
  sortDir: string;
  search: string;
  filterClassification: GameClassification;
  filterInstalled: boolean;
}

const hooked = hookWithProps(BundlePage)((map) => ({
  bundleId: map((rs, props) =>
    parseInt(ambientTab(rs, props).location.secondPathElement, 10)
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
}))(BundlePage);
export default withProfile(withTab(hooked));
