import { queries } from "common/queries";
import React, { useState, useEffect } from "react";
import { useAsyncCallback } from "react-async-hook";
import { FormattedMessage } from "react-intl";
import { Button } from "renderer/basics/Button";
import { IconButton } from "renderer/basics/IconButton";
import { Modal } from "renderer/basics/Modal";
import { useProfile, useSocket } from "renderer/contexts";
import { ProfileButton } from "renderer/Shell/ProfileButton";
import { useListen } from "renderer/Socket";
import { packets } from "common/packets";
import styled from "styled-components";

const Logo = styled.img`
  width: auto;
  height: 25px;
  margin: 10px 0;
  margin-left: 15px;
  margin-right: 35px;
`;

const TopbarDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  button.button {
    align-self: stretch;
    margin-right: 1em;

    border-radius: 0 0 4px 4px;
  }
`;

const DraggableFiller = styled.div`
  -webkit-app-region: drag;
  align-self: stretch;
  flex-grow: 1;
`;

type PopoverName = "preferences" | "downloads" | null;

export const Topbar = () => {
  const socket = useSocket();
  const [maximized, setMaximized] = useState(false);
  const [popover, setPopover] = useState<PopoverName>(null);
  let profile = useProfile();

  let close = useAsyncCallback(async () => {
    await socket.query(queries.close);
  });

  let minimize = useAsyncCallback(async () => {
    await socket.query(queries.minimize);
  });

  let toggleMaximized = useAsyncCallback(async () => {
    await socket.query(queries.toggleMaximized);
  });

  useEffect(() => {
    (async () => {
      try {
        const { maximized } = await socket.query(queries.isMaximized);
        setMaximized(maximized);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useListen(socket, packets.maximizedChanged, ({ maximized }) => {
    setMaximized(maximized);
  });

  return (
    <TopbarDiv>
      <Logo src={require("static/images/logos/app-white.svg")} />
      <Button
        onClick={() => (location.href = "https://itch.io")}
        icon="earth"
        label={<FormattedMessage id={"sidebar.explore"} />}
      />
      <Button
        onClick={() => (location.href = "itch://library")}
        icon="heart-filled"
        label={<FormattedMessage id={"sidebar.library"} />}
      />
      <DraggableFiller />
      <IconButton icon="download" onClick={() => setPopover("downloads")} />
      <ProfileButton
        profile={profile}
        openPreferences={() => setPopover("preferences")}
      />
      <IconButton icon="window-minimize" onClick={minimize.execute} />
      <IconButton
        icon={maximized ? "window-restore" : "window-maximize"}
        onClick={toggleMaximized.execute}
      />
      <IconButton icon="close" onClick={close.execute} />
      <Popover name={popover} onClose={() => setPopover(null)} />
    </TopbarDiv>
  );
};

const Popover = (props: { name: PopoverName; onClose: () => void }) => {
  const socket = useSocket();
  const switchLanguage = useAsyncCallback(async lang => {
    socket.query(queries.switchLanguage, { lang });
  });

  const { name, onClose } = props;
  switch (name) {
    case "preferences":
      return (
        <Modal
          onClose={onClose}
          title={<FormattedMessage id="sidebar.preferences" />}
        >
          <p>Have some prefs!</p>
          <p>
            <button onClick={() => switchLanguage.execute("fr")}>
              Switch to French
            </button>
          </p>
          <p>
            <button onClick={() => switchLanguage.execute("en")}>
              Switch to English
            </button>
          </p>
        </Modal>
      );
    case "downloads":
      return (
        <Modal
          onClose={onClose}
          title={<FormattedMessage id="sidebar.downloads" />}
        >
          <p>Your downloads go here</p>
        </Modal>
      );
    case null:
      return null;
  }
};
