import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import GameSeries from "renderer/pages/common/GameSeries";
import MainAction from "renderer/basics/MainAction";
import GameStatusGetter from "renderer/basics/GameStatusGetter";
import { SortSpacer } from "renderer/pages/common/SortsAndFilters";

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
        renderItemExtras={cave => (
          <>
            <GameStatusGetter
              game={cave.game}
              render={status => <MainAction game={cave.game} status={status} />}
            />
            <SortSpacer />
          </>
        )}
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
