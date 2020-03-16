import { DownloadProgress } from "common/butlerd/messages";
import _ from "lodash";
import React, { useCallback, useState } from "react";
import { Button } from "renderer/basics/Button";
import { MenuTippy } from "renderer/basics/Menu";
import {
  ClickOutsideRefer,
  useClickOutside,
} from "renderer/basics/useClickOutside";
import { InstallMenu } from "renderer/Shell/InstallMenu";
import { useDownloads } from "renderer/use-downloads";

interface HighLevelProps {
  wide?: boolean;
  gameId: number;
}

type LowLevelProps = HighLevelProps & {
  coref: ClickOutsideRefer;
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
    openDownloads,
    gameId,
    downloadProgress,
    beingInstalled,
  } = props;

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
          content={<InstallMenu ref={coref("menu")} gameId={gameId} />}
        >
          {content}
        </MenuTippy>
      );
    } else {
      return content;
    }
  };

  const install = useCallback(() => {
    props.install(gameId);
  }, [props.install, gameId]);

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
        onClick={install}
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
      menuOpen={menuOpen}
      beingInstalled={!!download}
      downloadProgress={download?.progress}
      openDownloads={openDownloads}
    />
  );
};
