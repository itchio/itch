import { messages } from "common/butlerd";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import {
  dispatchTabEvolve,
  dispatchTabPageUpdate,
} from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const FetchGame = butlerCaller(messages.FetchGame);

class GamePage extends React.PureComponent<Props> {
  render() {
    const { gameId } = this.props;

    return (
      <FetchGame
        params={{ gameId }}
        loadingHandled
        render={this.renderFetchContents}
        onResult={this.onResult}
      />
    );
  }

  renderFetchContents = FetchGame.renderCallback(({ loading }) => (
    <FiltersContainer loading={loading} />
  ));

  onResult = FetchGame.onResultCallback((result) => {
    if (result) {
      const { game } = result;
      if (game) {
        dispatchTabPageUpdate(this.props, {
          label: game.title,
        });
        dispatchTabEvolve(this.props, {
          replace: true,
          url: game.url,
          resource: `games/${game.id}`,
        });
      }
    }
  });
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  gameId: number;
}

export default withTab(
  hookWithProps(GamePage)((map) => ({
    gameId: map((rs, props) => ambientTab(rs, props).location.firstPathNumber),
  }))(GamePage)
);
