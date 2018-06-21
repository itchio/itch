import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import GameSeries from "renderer/pages/common/GameSeries";
import StandardMainAction from "renderer/pages/common/StandardMainAction";

const InstalledSeries = GameSeries(messages.FetchCaves);

class InstalledPage extends React.PureComponent<Props> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <InstalledSeries
        label={["sidebar.installed"]}
        params={{ limit: 15, cursor: sp.queryParam("cursor") }}
        getGame={cave => cave.game}
        renderItemExtras={cave => <StandardMainAction game={cave.game} />}
      />
    );
  }
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
  tabInstance: TabInstance;
}

export default withTab(withTabInstance(withDispatch(InstalledPage)));
