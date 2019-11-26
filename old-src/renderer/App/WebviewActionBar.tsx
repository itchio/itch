import React, { useContext } from "react";
import styled from "renderer/styles";
import dump from "common/util/dump";
import { Call, useButlerd } from "renderer/use-butlerd";
import { messages } from "common/butlerd";
import { Button } from "renderer/basics/Button";
import { SocketContext, useSocket } from "renderer/Route";
import { packets } from "common/packets";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-right: 15px;
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

export const WebviewActionBar = (props: Props) => {
  const socket = useSocket();
  const { path } = props;
  if (!path) {
    return <></>;
  }

  const matches = /^games\/([0-9]+)$/.exec(path);
  if (matches) {
    const gameId = parseInt(matches[1], 10);
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
                    label="Launch"
                    wide
                    onClick={() => socket!.send(packets.launchGame, { gameId })}
                  />
                ) : (
                  <Button label="Install" wide onClick={() => alert("stub!")} />
                ))}
            </>
          )}
        />
      </Container>
    );
  }

  return <></>;
};
