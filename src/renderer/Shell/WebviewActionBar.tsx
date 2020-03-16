import { messages } from "common/butlerd";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { LaunchButton } from "renderer/basics/LaunchButton";
import { useClickOutside } from "renderer/basics/useClickOutside";
import { useSocket } from "renderer/contexts";
import { InstallPopoverContents } from "renderer/Shell/InstallPopover";
import { useCaves } from "renderer/use-caves";
import styled from "styled-components";
import { Game } from "../../common/butlerd/messages";
import { IconButton } from "../basics/IconButton";
import { MenuTippy } from "../basics/Menu";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  margin-right: 35px;

  min-height: 80px;
  border-top: 1px solid ${props => props.theme.colors.shellBorder};
`;

const Cover = styled.img`
  height: 80px;
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

const Spacer = styled.div`
  flex-basis: 10px;
`;

interface Props {
  path: string;
}

const WebviewGameActionBar = (props: { gameId: number }) => {
  const socket = useSocket();
  const { gameId } = props;
  const [installing, setInstalling] = useState(false);
  const [game, setGame] = useState<Game | null>(null);

  const caves = useCaves({ gameId });

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

  const coref = useClickOutside(() => {
    setInstalling(false);
  });

  if (!game) {
    return null;
  }

  let makeInstallModal = (children: React.ReactElement<any>): JSX.Element => {
    return (
      <MenuTippy
        appendTo={document.body}
        placement="top-end"
        content={
          <InstallPopoverContents
            ref={coref("install-modal-contents")}
            coref={coref}
            game={game}
            onClose={() => setInstalling(false)}
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
    <Container className="webview-action-bar">
      <Cover src={game.stillCoverUrl || game.coverUrl} />
      <Info>
        <span>{game.title}</span>
      </Info>
      <Filler />
      {!_.isEmpty(caves) ? (
        <>
          {makeInstallModal(
            <IconButton
              className="install-button"
              ref={coref("install-icon")}
              icon="install"
              onClick={ev => {
                setInstalling(!installing);
              }}
            />
          )}
          <Spacer />
          <LaunchButton gameId={gameId} />
        </>
      ) : (
        makeInstallModal(
          <Button
            className="install-button"
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
