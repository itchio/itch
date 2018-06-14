import React from "react";

import { ITabInstance } from "common/types";

import { Space } from "common/helpers/space";
import { withTab } from "./meats/tab-provider";
import { withDispatch, Dispatch } from "./dispatch-provider";
import { withTabInstance } from "./meats/tab-instance-provider";
import ButlerCall from "./butler-call/butler-call";
import { messages } from "common/butlerd";
import BrowserContextGame from "./browser-context-game";

const FetchGame = ButlerCall(messages.FetchGame);

class BrowserContext extends React.PureComponent<Props> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    if (sp.prefix === "games") {
      const gameId = sp.numericId();
      return (
        <FetchGame
          params={{ gameId }}
          sequence={tabInstance.sequence}
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
  tab: string;
  tabInstance: ITabInstance;
  dispatch: Dispatch;
}

export default withTab(withTabInstance(withDispatch(BrowserContext)));
