import React from "react";
import { withTabInstance } from "./meats/tab-instance-provider";
import { withTab } from "./meats/tab-provider";
import { ITabInstance } from "common/types";
import ButlerCall from "./butler-call/butler-call";
import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { actions } from "common/actions";
import { Dispatch, withDispatch } from "./dispatch-provider";

const FetchGame = ButlerCall(messages.FetchGame);

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
  tabInstance: ITabInstance;
  dispatch: Dispatch;
}

export default withTabInstance(withTab(withDispatch(GamePage)));
