import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { ambientWind } from "common/util/navigation";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const FetchGame = butlerCaller(messages.FetchGame);

class GamePage extends React.PureComponent<Props> {
  render() {
    const { space, dispatch } = this.props;
    const gameId = space.firstPathNumber();

    return (
      <FetchGame
        params={{ gameId }}
        loadingHandled
        render={({ loading }) => <FiltersContainer loading={loading} />}
        onResult={result => {
          if (result) {
            const { game } = result;
            if (game) {
              dispatch(
                space.makeEvolve({
                  wind: ambientWind(),
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

interface Props extends MeatProps {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(hook()(GamePage));
