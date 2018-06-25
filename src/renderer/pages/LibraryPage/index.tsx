import { messages } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { withProfile } from "renderer/hocs/withProfile";
import GameStripe from "renderer/pages/common/GameStripe";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const OwnedGameStripe = GameStripe(messages.FetchProfileOwnedKeys);
const InstalledGameStripe = GameStripe(messages.FetchCaves);

class LibraryPage extends React.PureComponent<Props> {
  render() {
    const { profile } = this.props;

    return (
      <Page>
        <FiltersContainer loading={false} />

        <ItemList>
          <OwnedGameStripe
            title={["sidebar.owned"]}
            href="itch://library/owned"
            params={{ profileId: profile.id }}
            getGame={x => x.game}
          />
          <InstalledGameStripe
            title={["sidebar.installed"]}
            href="itch://library/installed"
            params={{ sortBy: "lastTouched" }}
            getGame={x => x.game}
          />
        </ItemList>
      </Page>
    );
  }
}

interface Props extends MeatProps {
  profile: Profile;
}

export default withProfile(LibraryPage);
