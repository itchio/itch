import React from "react";
import { TabInstance } from "common/types";
import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { actions } from "common/actions";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { withTab } from "renderer/hocs/withTab";
import butlerCaller from "renderer/hocs/butlerCaller";

const FetchGame = butlerCaller(messages.FetchGame);

class GamePage extends React.PureComponent<Props> {
  render() {
    const { tab, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const gameId = sp.firstPathNumber();

    return (
      <FetchGame
        params={{ gameId }}
        render={() => null}
        onResult={result => {
          if (result) {
            const { game } = result;
            if (game) {
              this.props.dispatch(
                actions.evolveTab({
                  window: "root",
                  tab,
                  url: game.url,
                  resource: `games/${gameId}`,
                  replace: true,
                })
              );
            }
          }
        }}
      />
    );
  }
}

interface Props {
  tab: string;
  tabInstance: TabInstance;
  dispatch: Dispatch;
}

export default withTabInstance(withTab(withDispatch(GamePage)));
