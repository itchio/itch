import { socket } from "renderer";
import { messages } from "common/butlerd";
import { Download } from "@itchio/valet/messages";
import { DownloadWithProgress } from "common/downloads";
import { gameCover } from "common/game-cover";
import { queries } from "common/queries";
import _ from "lodash";
import React, { useState } from "react";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import { MenuContents, MenuTippy } from "renderer/basics/Menu";
import { useClickOutside } from "renderer/basics/use-click-outside";
import { fontSizes } from "renderer/theme";
import { useAsyncCb } from "renderer/use-async-cb";
import { useDownloads } from "renderer/use-downloads";
import styled from "styled-components";

interface Props {}

export const DownloadsButton = (props: Props) => {
  const [shown, setShown] = useState(false);
  const coref = useClickOutside(() => {
    setShown(false);
  });
  const toggle = () => {
    setShown(!shown);
  };

  return (
    <MenuTippy
      content={
        <DownloadsContents ref={coref("downloads-content")} onClose={toggle} />
      }
      visible={shown}
      maxWidth={600}
      interactive
    >
      <Button
        ref={coref("downloads-button")}
        onClick={toggle}
        icon="download"
        secondary={shown}
        label={<FormattedMessage id={"sidebar.downloads"} />}
        className="topbar-item"
      />
    </MenuTippy>
  );
};

const DownloadContentsDiv = styled.div`
  min-width: 400px;
  border-radius: 4px;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  align-items: stretch;

  .row {
    &,
    a {
      display: flex;
      flex-direction: row;
      align-items: center;
      text-decoration: none;
      color: inherit;
      font-size: ${fontSizes.large};
    }

    a {
      flex-grow: 1;
    }

    .filler {
      flex-grow: 1;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .thumbnail {
    width: 61px;
    height: 48px;
    margin-right: 1em;

    &.placeholder {
      background: rgba(0, 0, 0, 0.3);
    }
  }

  .empty-state {
    padding: 1em;
    font-size: ${fontSizes.large};
  }
`;

export const DownloadsContents = React.forwardRef(
  (props: { onClose: () => void }, ref: React.Ref<HTMLDivElement>) => {
    const downloads = useDownloads();
    const sortedDownloads = _.sortBy(downloads, (d) => d.position);

    const [clearAll, clearAllLoading] = useAsyncCb(async () => {
      await socket.call(messages.DownloadsClearFinished, {});
    }, []);

    return (
      <DownloadContentsDiv ref={ref}>
        {_.isEmpty(downloads) ? (
          <div className="empty-state">No downloads</div>
        ) : (
          <>
            {sortedDownloads.map((d) => {
              return (
                <DownloadItem key={d.id} download={d} onClose={props.onClose} />
              );
            })}
            <MenuContents>
              <Button
                label={
                  <FormattedMessage id="status.downloads.clear_all_finished" />
                }
                onClick={clearAll}
                loading={clearAllLoading}
              />
            </MenuContents>
          </>
        )}
      </DownloadContentsDiv>
    );
  }
);

const DownloadItem = (props: {
  download: DownloadWithProgress;
  onClose: () => void;
}) => {
  const d = props.download;

  const [play, playLoading] = useAsyncCb(async (gameId: number) => {
    await socket.query(queries.launchGame, { gameId });
  }, []);

  let coverUrl = gameCover(d.game);
  return (
    <div className="row">
      <a href={`itch://games/${d.game.id}`} onClick={props.onClose}>
        {coverUrl ? (
          <img className="thumbnail" src={coverUrl} />
        ) : (
          <div className="thumbnail placeholder" />
        )}
        <span>{d.game.title}</span>
        <div className="filler" />
      </a>

      <MenuTippy
        content={<DownloadsMenu download={d} />}
        interactive
        placement="right-start"
      >
        {d.finishedAt ? (
          <IconButton
            icon="play2"
            onClick={() => play(d.game.id)}
            loading={playLoading}
          />
        ) : (
          <IconButton
            icon={<LoadingCircle progress={d.progress?.progress ?? 1} />}
          />
        )}
      </MenuTippy>
    </div>
  );
};

const DownloadsMenu = (props: { download: Download }) => {
  const d = props.download;

  const [uninstall, uninstallLoading] = useAsyncCb(async () => {
    await socket.call(messages.UninstallPerform, {
      caveId: d.caveId,
    });
  }, [d]);
  const [discard, discardLoading] = useAsyncCb(async () => {
    await socket.call(messages.DownloadsDiscard, {
      downloadId: d.id,
    });
  }, [d]);

  return (
    <MenuContents>
      <Button
        icon="cross"
        label={<FormattedMessage id="grid.item.discard_download" />}
        onClick={discard}
        loading={discardLoading}
      />
      <Button
        icon="earth"
        label={<FormattedMessage id="grid.item.open_page" />}
        onClick={() => (location.href = `itch://games/${d.game.id}`)}
      />
      <Button
        icon="uninstall"
        label={<FormattedMessage id="grid.item.uninstall" />}
        onClick={uninstall}
        loading={uninstallLoading}
      />
    </MenuContents>
  );
};
