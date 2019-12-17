import { messages } from "common/butlerd";
import { queries } from "common/queries";
import React, { useEffect, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { useSocket } from "renderer/contexts";
import { InstallModalContents } from "renderer/Shell/InstallModal";
import { useButlerd } from "renderer/use-butlerd";
import styled from "styled-components";
import { Game, Cave } from "../../common/butlerd/messages";
import { IconButton } from "../basics/IconButton";
import { MenuTippy } from "../basics/Menu";
import { useClickOutside } from "renderer/basics/useClickOutside";
import _ from "lodash";
import { useListen } from "renderer/Socket";
import { packets } from "common/packets";

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

interface CavesForGame {
  [caveId: string]: Cave;
}

const WebviewGameActionBar = (props: { gameId: number }) => {
  const socket = useSocket();
  const { gameId } = props;
  const [installing, setInstalling] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [caves, setCaves] = useState<CavesForGame>({});
  const mergeCaves = (fresh: CavesForGame) => {
    setCaves({ ...caves, ...fresh });
  };

  // fetch game info
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

  // fetch caves
  useEffect(() => {
    setCaves({});

    (async () => {
      try {
        const { items } = await socket.call(messages.FetchCaves, {
          filters: {
            gameId: props.gameId,
          },
        });
        setCaves(_.keyBy(items, "id"));
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [gameId]);

  useListen(socket, packets.gameInstalled, ({ cave }) => {
    mergeCaves({ [cave.id]: cave });
  });
  useListen(socket, packets.gameUninstalled, ({ caveId }) => {
    setCaves(_.omit(caves, caveId));
  });

  const coref = useClickOutside(() => {
    setInstalling(false);
  });

  let launchGame = useAsyncCallback(async (gameId: number) => {
    await socket.query(queries.launchGame, { gameId });
  });

  if (!game) {
    return null;
  }

  let makeInstallModal = (children: React.ReactElement<any>): JSX.Element => {
    return (
      <MenuTippy
        placement="top"
        content={
          <InstallModalContents
            ref={coref("install-modal-contents")}
            coref={coref}
            game={game}
          />
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
      {!_.isEmpty(caves) ? (
        <>
          <Button
            icon="play2"
            label={<FormattedMessage id="grid.item.launch" />}
            disabled={launchGame.loading}
            onClick={() => launchGame.execute(gameId)}
          />
          {makeInstallModal(
            <IconButton
              ref={coref("install-icon")}
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
            ref={coref("install-button")}
            icon="install"
            label={<FormattedMessage id="grid.item.install" />}
            onClick={() => setInstalling(!installing)}
          />
        )
      )}
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
