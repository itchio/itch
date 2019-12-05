import { messages } from "common/butlerd";
import { queries } from "common/queries";
import React, { useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { InstallModal } from "renderer/Shell/InstallModal";
import { Button } from "renderer/basics/Button";
import { useSocket } from "renderer/contexts";
import styled from "renderer/styles";
import { Call, useButlerd } from "renderer/use-butlerd";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-right: 25px;

  min-height: 100px;
  border-top: 1px solid ${props => props.theme.inputBorder};
`;

const Cover = styled.img`
  height: 100px;
`;

const Info = styled.div`
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;

  * {
    padding: 4px 0;
  }
`;

const Filler = styled.div`
  flex-grow: 1;
`;

interface Props {
  path: string;
}

const WebviewGameActionBar = (props: { gameId: number }) => {
  const socket = useSocket();
  let [installing, setInstalling] = useState(false);

  const { gameId } = props;

  let launchGame = useAsyncCallback(async (gameId: number) => {
    await socket.query(queries.launchGame, { gameId });
  });

  const cavesReq = useButlerd(messages.FetchCaves, { filters: { gameId } });
  let caves = cavesReq.state === "success" && (cavesReq.result.items || []);

  return (
    <Container>
      <Call
        rc={messages.FetchGame}
        params={{ gameId }}
        render={({ game }) => (
          <>
            <Cover src={game.stillCoverUrl || game.coverUrl} />
            <Info>
              <span>{game.title}</span>
              {caves && <span>Found {caves.length} caves</span>}
            </Info>
            <Filler />
            {caves &&
              (caves.length > 0 ? (
                <Button
                  icon="play2"
                  label={<FormattedMessage id="grid.item.launch" />}
                  disabled={launchGame.loading}
                  onClick={() => launchGame.execute(gameId)}
                />
              ) : (
                <Button
                  icon="install"
                  label={<FormattedMessage id="grid.item.install" />}
                  onClick={() => setInstalling(true)}
                />
              ))}
            {installing ? (
              <InstallModal game={game} onClose={() => setInstalling(false)} />
            ) : null}
          </>
        )}
      />
    </Container>
  );
};

const WebviewEmptyActionBar = () => {
  return (
    <Container>
      <div style={{ marginLeft: "2em" }}>Real empty in there</div>
    </Container>
  );
};

export const WebviewActionBar = (props: Props) => {
  const { path } = props;
  if (path) {
    const matches = /^games\/([0-9]+)$/.exec(path);
    if (matches) {
      const gameId = parseInt(matches[1], 10);
      return <WebviewGameActionBar gameId={gameId} />;
    }
  }

  return <WebviewEmptyActionBar />;
};

export default WebviewActionBar;
