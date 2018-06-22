import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withSpace } from "renderer/hocs/withSpace";

const FetchGame = butlerCaller(messages.FetchGame);

class GamePage extends React.PureComponent<Props> {
  render() {
    const { space, dispatch } = this.props;
    const gameId = space.firstPathNumber();

    return (
      <FetchGame
        params={{ gameId }}
        render={() => null}
        onResult={result => {
          if (result) {
            const { game } = result;
            if (game) {
              dispatch(
                space.makeEvolve({
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
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(withDispatch(GamePage));
