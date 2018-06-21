import React from "react";

import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import FiltersContainer from "renderer/basics/FiltersContainer";
import Page from "renderer/pages/common/Page";
import ItemList from "renderer/pages/common/ItemList";
import { messages } from "common/butlerd";
import { isEmpty } from "underscore";
import { withProfileId } from "renderer/hocs/withProfileId";
import {
  FetchProfileOwnedKeysResult,
  FetchCavesResult,
} from "common/butlerd/messages";
import GameStripe from "renderer/pages/common/GameStripe";

const OwnedGameStripe = GameStripe(messages.FetchProfileOwnedKeys);
const InstalledGameStripe = GameStripe(messages.FetchCaves);

class LibraryPage extends React.PureComponent<Props> {
  render() {
    const { profileId } = this.props;

    return (
      <Page>
        <FiltersContainer loading={false} />

        <ItemList>
          <OwnedGameStripe
            title={["sidebar.owned"]}
            href="itch://library/owned"
            params={{ profileId }}
            map={(r: FetchProfileOwnedKeysResult) =>
              !isEmpty(r.items) && r.items.map(x => x.game)
            }
          />
          <InstalledGameStripe
            title={["sidebar.installed"]}
            href="itch://library/installed"
            params={{ sortBy: "lastTouched" }}
            map={(r: FetchCavesResult) =>
              !isEmpty(r.items) && r.items.map(x => x.game)
            }
          />
        </ItemList>
      </Page>
    );
  }
}

interface Props extends MeatProps {
  profileId: number;
}

export default withProfileId(LibraryPage);
