import { messages } from "common/butlerd";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
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
    const { space } = this.props;
    if (space.prefix === "games") {
      const gameId = space.numericId();
      return (
        <BrowserContextContainer>
          <FetchGame
            params={{ gameId }}
            sequence={space.sequence()}
            render={({ result }) => {
              return <BrowserContextGame game={result.game} />;
            }}
          />
        </BrowserContextContainer>
      );
    }

    return null;
  }
}

interface Props {
  space: Space;
  dispatch: Dispatch;
}

export default withSpace(hook()(BrowserContext));
