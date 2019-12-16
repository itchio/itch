import { messages } from "common/butlerd";
import { queries } from "common/queries";
import React, { useState, useEffect } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { InstallModalContents } from "renderer/Shell/InstallModal";
import { Button } from "renderer/basics/Button";
import { useSocket } from "renderer/contexts";
import { Call, useButlerd } from "renderer/use-butlerd";
import styled from "styled-components";
import { IconButton } from "../basics/IconButton";
import { useOutsideClickListener } from "react-click-outside-listener";
import { MenuTippy } from "../basics/Menu";
import { Game } from "../../common/butlerd/messages";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-right: 25px;

  min-height: 100px;
  border-top: 1px solid ${props => props.theme.colors.shellBorder};
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
  const { gameId } = props;
  const [installing, setInstalling] = useState(false);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { game } = await socket.callWithRefresh(messages.FetchGame, {
          gameId,
        });
        setGame(game);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [gameId]);

  const coref = useOutsideClickListener(() => {
    setInstalling(false);
  });

  let launchGame = useAsyncCallback(async (gameId: number) => {
    await socket.query(queries.launchGame, { gameId });
  });

  const cavesReq = useButlerd(messages.FetchCaves, { filters: { gameId } });
  let caves = cavesReq.state === "success" && (cavesReq.result.items || []);

  if (!game) {
    return null;
  }

  let makeInstallModal = (children: React.ReactElement<any>): JSX.Element => {
    return (
      <MenuTippy
        placement="top"
        content={
          <InstallModalContents coref={coref} corefStart={1} game={game} />
        }
        interactive
        visible={installing}
      >
        {children}
      </MenuTippy>
    );
  };

  return (
    <Container>
      <Cover src={game.stillCoverUrl || game.coverUrl} />
      <Info>
        <span>{game.title}</span>
        {caves && <span>Found {caves.length} caves</span>}
      </Info>
      <Filler />
      {caves &&
        (caves.length > 0 ? (
          <>
            <Button
              icon="play2"
              label={<FormattedMessage id="grid.item.launch" />}
              disabled={launchGame.loading}
              onClick={() => launchGame.execute(gameId)}
            />
            {makeInstallModal(
              <IconButton
                ref={coref(0)}
                icon="install"
                onClick={ev => {
                  setInstalling(!installing);
                }}
              />
            )}
          </>
        ) : (
          makeInstallModal(
            <Button
              ref={coref(0)}
              icon="install"
              label={<FormattedMessage id="grid.item.install" />}
              onClick={() => setInstalling(true)}
            />
          )
        ))}
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

  return null;
};

export default WebviewActionBar;
