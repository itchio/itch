import { messages } from "common/butlerd";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import { browserContextHeight } from "renderer/pages/BrowserPage/BrowserContext/BrowserContextConstants";
import BrowserContextGame from "renderer/pages/BrowserPage/BrowserContext/BrowserContextGame";
import styled from "renderer/styles";

const FetchGame = butlerCaller(messages.FetchGame);

const BrowserContextContainer = styled.div`
  height: ${browserContextHeight}px;

  display: flex;
  flex-direction: column;
  justify-content: center;
`;

class BrowserContext extends React.PureComponent<Props> {
  render() {
    const { gameId, sequence } = this.props;
    if (!gameId) {
      return null;
    }

    return (
      <BrowserContextContainer>
        <FetchGame
          params={{ gameId }}
          sequence={sequence}
          render={this.renderFetchContents}
        />
      </BrowserContextContainer>
    );
  }

  renderFetchContents = FetchGame.renderCallback(({ result }) => {
    return <BrowserContextGame game={result.game} />;
  });
}

interface Props {
  tab: string;
  dispatch: Dispatch;

  gameId: number;
  sequence: number;
}

export default withTab(
  hookWithProps(BrowserContext)((map) => ({
    sequence: map((props, rs) => ambientTab(props, rs).sequence),
    gameId: map((props, rs) => {
      const { resource } = ambientTab(props, rs);
      if (resource && resource.prefix === "games") {
        return resource.numericId;
      }
      return null;
    }),
  }))(BrowserContext)
);
