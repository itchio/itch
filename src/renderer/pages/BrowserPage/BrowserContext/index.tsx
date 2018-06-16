import React from "react";

import { TabInstance } from "common/types";

import { Space } from "common/helpers/space";
import { messages } from "common/butlerd";
import BrowserContextGame from "./BrowserContextGame";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";

const FetchGame = butlerCaller(messages.FetchGame);

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
  tabInstance: TabInstance;
  dispatch: Dispatch;
}

export default withTab(withTabInstance(withDispatch(BrowserContext)));
