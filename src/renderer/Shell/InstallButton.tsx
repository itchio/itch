import { DownloadProgress } from "common/butlerd/messages";
import _ from "lodash";
import React, { useCallback, useState } from "react";
import { Button } from "renderer/basics/Button";
import { MenuTippy } from "renderer/basics/Menu";
import {
  ClickOutsideRefer,
  useClickOutside,
} from "renderer/basics/use-click-outside";
import { InstallMenu } from "renderer/Shell/InstallMenu";
import { useDownloads } from "renderer/use-downloads";

interface HighLevelProps {
  wide?: boolean;
  gameId: number;
}

type LowLevelProps = HighLevelProps & {
  coref: ClickOutsideRefer;
  onClose: () => void;
  menuOpen: boolean;
  downloadProgress?: DownloadProgress;
  beingInstalled: boolean;
  install: (gameId: number) => void;
  openDownloads: () => void;
};

export const InstallButtonBase = (props: LowLevelProps) => {
  const {
    coref,
    wide,
    menuOpen,
    onClose,
    openDownloads,
    gameId,
    downloadProgress,
    beingInstalled,
    install,
  } = props;

  const onInstall = useCallback(() => {
    install(gameId);
  }, [install, gameId]);

  if (downloadProgress) {
    return <Button label="Downloading..." />;
  }

  let wrap = (content: any) => {
    if (menuOpen) {
      return (
        <MenuTippy
          maxWidth={400}
          visible
          interactive
          placement="bottom-end"
          appendTo={document.body}
          content={
            <InstallMenu
              ref={coref("menu")}
              gameId={gameId}
              onClose={onClose}
            />
          }
        >
          {content}
        </MenuTippy>
      );
    } else {
      return content;
    }
  };

  return wrap(
    beingInstalled ? (
      <Button
        ref={coref("button")}
        wide={wide}
        label="Installing..."
        onClick={openDownloads}
      />
    ) : (
      <Button
        ref={coref("button")}
        wide={wide}
        label="Install"
        secondary
        onClick={onInstall}
      />
    )
  );
};

export const InstallButton = (props: HighLevelProps) => {
  const { gameId } = props;

  const downloads = useDownloads({ gameId });
  const download = _.first(_.filter(_.values(downloads), dl => !dl.finishedAt));

  const [menuOpen, setMenuOpen] = useState(false);

  const install = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const coref = useClickOutside(() => {
    setMenuOpen(false);
  });

  const openDownloads = useCallback(() => {
    console.warn("TODO: open downloads");
  }, []);

  return (
    <InstallButtonBase
      {...props}
      coref={coref}
      install={install}
      onClose={onClose}
      menuOpen={menuOpen}
      beingInstalled={!!download}
      downloadProgress={download?.progress}
      openDownloads={openDownloads}
    />
  );
};
