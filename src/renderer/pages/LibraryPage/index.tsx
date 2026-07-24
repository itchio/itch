import * as messages from "common/butlerd/messages";
import { Profile } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withProfile } from "renderer/hocs/withProfile";
import { withTab } from "renderer/hocs/withTab";
import BundleStripe from "renderer/pages/LibraryPage/BundleStripe";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { makeGameStripe } from "renderer/pages/common/GameStripe";
import { _ } from "renderer/t";
import ScanningIndicator from "renderer/pages/common/ScanningIndicator";

const OwnedGameStripe = makeGameStripe(messages.FetchProfileOwnedKeys);
const InstalledGameStripe = makeGameStripe(messages.FetchCaves);
const FetchProfileOwnedBundles = butlerCaller(
  messages.FetchProfileOwnedBundles
);

class LibraryPage extends React.PureComponent<Props> {
  override render() {
    const { profile, sequence } = this.props;

    return (
      <Page>
        <FiltersContainer loading={false} />

        <ItemList>
          <OwnedGameStripe
            title={_("sidebar.owned")}
            href="itch://library/owned"
            params={{ profileId: profile.id }}
            getGame={this.ownedGetGame}
            linkId="library-owned"
          />
          <InstalledGameStripe
            title={_("sidebar.installed")}
            href="itch://library/installed"
            params={{ sortBy: "lastTouched", profileId: profile.id }}
            getGame={this.installedGetGame}
            renderTitleExtras={this.installedTitleExtras}
            linkId="library-installed"
          />
          <FetchProfileOwnedBundles
            params={{ profileId: profile.id, limit: 100 }}
            sequence={sequence}
            loadingHandled
            errorsHandled
            render={this.renderBundles}
          />
        </ItemList>
      </Page>
    );
  }

  ownedGetGame = OwnedGameStripe.getGameCallback((x) => x.game);
  installedGetGame = InstalledGameStripe.getGameCallback((x) => x.game);

  installedTitleExtras = () => {
    return <ScanningIndicator />;
  };

  renderBundles = FetchProfileOwnedBundles.renderCallback(({ result }) => {
    if (!result || !result.items) {
      return null;
    }
    return (
      <>
        {result.items.map((bk) => (
          <BundleStripe key={bk.id} bundleKey={bk} />
        ))}
      </>
    );
  });

  override componentDidMount() {
    dispatchTabPageUpdate(this.props, { label: ["sidebar.library"] });
  }
}

interface Props extends MeatProps {
  profile: Profile;
  dispatch: Dispatch;
  tab: string;
}

export default withProfile(withTab(hook()(LibraryPage)));
