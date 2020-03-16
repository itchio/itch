import React, { useState } from "react";
import { Topbar } from "renderer/Shell/Topbar";
import { Webview } from "renderer/Shell/Webview";
const Gate = React.lazy(() => import("renderer/Gate"));
import {
  useSocket,
  useOptionalProfile,
  ProfileContext,
} from "renderer/contexts";
import styled from "styled-components";
import LibraryPage from "renderer/pages/LibraryPage";
import { Icon } from "renderer/basics/Icon";
import { useListen } from "renderer/Socket";
import { packets } from "common/packets";
import classNames from "classnames";

const ShellDiv = styled.div`
  border: 1px solid ${p => p.theme.colors.shellBorder};
  background: ${p => p.theme.colors.shellBg};

  display: flex;
  flex-direction: column;

  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  overflow: hidden;
`;

const MainDiv = styled.div`
  flex-grow: 1;
  overflow-y: hidden;
`;

const WebviewContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background: rgba(0, 0, 0, 0.8);

  nav {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .icon {
      font-size: 28px;
      padding: 40px 20px;

      transition: all 0.2s;

      transform: scale(0.8);
      color: ${p => p.theme.colors.text2};

      width: 10vw;
      text-align: center;

      &:hover {
        transform: scale(1);
        color: ${p => p.theme.colors.text1};
      }
    }
  }

  position: absolute;
  left: 0;
  right: 0px;
  top: 45px;
  bottom: 0px;
  z-index: 3;

  border: 1px solid ${p => p.theme.colors.shellBg};
  box-shadow: 0 0 30px black;

  &,
  .webview-container,
  nav {
    transition: all 0.2s ease-out;
  }

  opacity: 0;
  pointer-events: none;

  .webview-container,
  nav {
    transform: translate(40px, 0);
  }

  &.open {
    .webview-container,
    nav {
      transform: translate(0%, 0);
    }
    opacity: 1;
    pointer-events: initial;
  }
`;

export const Shell = () => {
  const socket = useSocket();
  const profile = useOptionalProfile();
  const [webviewOpen, setWebviewOpen] = useState(false);
  const [firstUrl, setFirstUrl] = useState("");

  useListen(
    socket,
    packets.navigate,
    ({ url }) => {
      if (!webviewOpen) {
        setFirstUrl(url);
        setWebviewOpen(true);
      }
    },
    [socket, webviewOpen]
  );

  if (!profile) {
    return (
      <ShellDiv>
        <Topbar />
        <Gate />
      </ShellDiv>
    );
  }

  return (
    <ProfileContext.Provider value={profile}>
      <ShellDiv>
        <Topbar />
        <MainDiv>
          <LibraryPage />
          <WebviewContainer className={classNames({ open: webviewOpen })}>
            <nav>
              <Icon onClick={() => setWebviewOpen(false)} icon="arrow-left" />
            </nav>
            <Webview url={firstUrl} />
          </WebviewContainer>
        </MainDiv>
      </ShellDiv>
    </ProfileContext.Provider>
  );
};

export default Shell;
