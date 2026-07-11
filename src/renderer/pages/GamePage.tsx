import * as messages from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
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
  override render() {
    const { gameId } = this.props;
    if (gameId === undefined || Number.isNaN(gameId)) {
      // no numeric game id in the URL: the fetch would have failed anyway,
      // show the same error state without the round-trip
      return <ErrorState error={new Error("Missing game id in URL")} />;
    }

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

  gameId: number | undefined;
}

export default withTab(
  hookWithProps(GamePage)((map) => ({
    gameId: map((rs, props) => ambientTab(rs, props).location?.firstPathNumber),
  }))(GamePage)
);
