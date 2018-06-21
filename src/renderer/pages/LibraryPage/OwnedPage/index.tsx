import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import GameSeries from "renderer/pages/common/GameSeries";
import StandardMainAction from "renderer/pages/common/StandardMainAction";

const OwnedSeries = GameSeries(messages.FetchProfileOwnedKeys);

class OwnedPage extends React.PureComponent<Props> {
  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <OwnedSeries
        label={["sidebar.owned"]}
        params={{ profileId, limit: 15, cursor: sp.queryParam("cursor") }}
        getGame={dk => dk.game}
        renderItemExtras={cave => <StandardMainAction game={cave.game} />}
      />
    );
  }
}

interface Props extends MeatProps {
  tab: string;
  profileId: number;
  dispatch: Dispatch;
  tabInstance: TabInstance;
}

export default withTab(withProfileId(withTabInstance(withDispatch(OwnedPage))));
