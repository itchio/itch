import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withSpace } from "renderer/hocs/withSpace";
import BrowserContextGame from "./BrowserContextGame";

const FetchGame = butlerCaller(messages.FetchGame);

class BrowserContext extends React.PureComponent<Props> {
  render() {
    const { space } = this.props;
    if (space.prefix === "games") {
      const gameId = space.numericId();
      return (
        <FetchGame
          params={{ gameId }}
          sequence={space.sequence()}
          render={({ result }) => {
            return <BrowserContextGame game={result.game} />;
          }}
        />
      );
    }

    return null;
  }
}

interface Props {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(withDispatch(BrowserContext));
