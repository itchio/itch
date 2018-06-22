import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import React from "react";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withSpace } from "renderer/hocs/withSpace";
import GameSeries from "renderer/pages/common/GameSeries";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const InstalledSeries = GameSeries(messages.FetchCaves);

class InstalledPage extends React.PureComponent<Props> {
  render() {
    const { space } = this.props;

    return (
      <InstalledSeries
        label={["sidebar.installed"]}
        params={{ limit: 15, cursor: space.queryParam("cursor") }}
        getGame={cave => cave.game}
        renderItemExtras={cave => <StandardMainAction game={cave.game} />}
      />
    );
  }
}

interface Props extends MeatProps {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(withDispatch(InstalledPage));
