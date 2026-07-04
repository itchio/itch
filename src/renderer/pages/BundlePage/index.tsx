import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import { Profile } from "common/butlerd/messages";
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
    const { profile, bundleId } = this.props;

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
          }}
          getRecord={this.getRecord}
          renderItemExtras={this.renderItemExtras}
          renderMainFilters={this.renderMainFilters}
        />
      </>
    );
  }

  getRecord = BundleGameSeries.getRecordCallback((bg) => bg.game);
  renderItemExtras = BundleGameSeries.renderItemExtrasCallback((bg) => (
    <StandardMainAction game={bg.game} forceOwned />
  ));
  renderMainFilters = () => (
    <IconButton
      icon="redo"
      hint={_("browser.popout")}
      hintPosition="bottom"
      onClick={this.popOutBrowser}
    />
  );

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
}

const hooked = hookWithProps(BundlePage)((map) => ({
  bundleId: map((rs, props) =>
    parseInt(ambientTab(rs, props).location.secondPathElement, 10)
  ),
}))(BundlePage);
export default withProfile(withTab(hooked));
