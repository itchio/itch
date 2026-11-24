import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import urls from "common/constants/urls";
import React, { useEffect } from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import MoreMenuButton from "renderer/pages/common/MoreMenuButton";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { useAppDispatch } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useProfile } from "renderer/hooks/useProfile";
import { useTab } from "renderer/hooks/useTab";
import BundleStripe from "renderer/pages/LibraryPage/BundleStripe";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { makeGameStripe } from "renderer/pages/common/GameStripe";
import { _ } from "renderer/t";
import ScanningIndicator from "renderer/pages/common/ScanningIndicator";

const OwnedGameStripe = makeGameStripe(messages.FetchProfileOwnedKeys);
const InstalledGameStripe = makeGameStripe(messages.FetchCaves);

const ownedGetGame = OwnedGameStripe.getGameCallback((x) => x.game);
const installedGetGame = InstalledGameStripe.getGameCallback((x) => x.game);
const renderScanningIndicator = () => <ScanningIndicator />;

const OwnedBundles = ({ sequence }: { sequence: number }) => {
  const profile = useProfile();
  const { result } = useButlerd(
    messages.FetchProfileOwnedBundles,
    { profileId: profile.id, limit: 100 },
    { sequence }
  );

  if (!result?.items) {
    return null;
  }
  return (
    <>
      {result.items.map((bk) => (
        <BundleStripe key={bk.id} bundleKey={bk} />
      ))}
    </>
  );
};

const LibraryPage = ({ sequence }: MeatProps) => {
  const tab = useTab();
  const dispatch = useAppDispatch();
  const profile = useProfile();

  useEffect(() => {
    dispatchTabPageUpdate({ tab, dispatch }, { label: ["sidebar.library"] });
  }, [tab, dispatch]);

  return (
    <Page>
      <FiltersContainer loading={false}>
        <MoreMenuButton
          template={[
            {
              localizedLabel: ["outlinks.manage_collections"],
              action: actions.openInExternalBrowser({
                url: urls.myCollections,
              }),
            },
          ]}
        />
      </FiltersContainer>

      <ItemList>
        <OwnedGameStripe
          title={_("sidebar.owned")}
          href="itch://library/owned"
          params={{ profileId: profile.id }}
          getGame={ownedGetGame}
          linkId="library-owned"
        />
        <InstalledGameStripe
          title={_("sidebar.installed")}
          href="itch://library/installed"
          params={{ sortBy: "lastTouched", profileId: profile.id }}
          getGame={installedGetGame}
          renderTitleExtras={renderScanningIndicator}
          linkId="library-installed"
        />
        <OwnedBundles sequence={sequence} />
      </ItemList>
    </Page>
  );
};

export default LibraryPage;
