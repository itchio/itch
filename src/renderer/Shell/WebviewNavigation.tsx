import { WebviewTag } from "electron";
import React, { useState } from "react";
import { IconButton } from "renderer/basics/IconButton";
import { animations, fontSizes } from "common/theme";
import styled from "styled-components";
import { MenuTippy, MenuContents } from "renderer/basics/Menu";
import { Button } from "renderer/basics/Button";
import { useClickOutside } from "renderer/basics/use-click-outside";
import { queries, QueryCreator } from "common/queries";
import { socket } from "renderer";

const Filler = styled.div`
  flex-grow: 1;
`;

const NavDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 2px;
  position: relative;
  overflow: hidden;

  .loader-inner {
    position: absolute;
    height: 2px;
    bottom: 2px;
    left: 0;
    right: 0;
  }

  &.loading {
    .loader-inner {
      background: repeating-linear-gradient(
        to right,
        transparent 0%,
        transparent 30%,
        ${(p) => p.theme.colors.accent} 30%,
        ${(p) => p.theme.colors.accent} 70%,
        transparent 70%,
        transparent 100%
      );
      animation: ${animations.horizontalIndeterminate} 2.4s ease-in-out infinite;
    }
  }
`;

interface Props {
  viewRef: React.RefObject<WebviewTag>;
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

const Title = styled.div`
  font-size: ${fontSizes.normal};
  padding-left: 1em;
`;

export const WebviewNavigation = (props: Props) => {
  const { title, url, loading } = props;
  const [showMenu, setShowMenu] = useState(false);
  const coref = useClickOutside(() => setShowMenu(false));

  let wcEvent = (q: QueryCreator<{ wcId: number }, void>) => {
    let wv = props.viewRef.current;
    if (wv) {
      socket.query(q, { wcId: wv.getWebContentsId() });
    }
  };

  return (
    <NavDiv className={loading ? "loading" : ""}>
      <IconButton
        onClick={() => wcEvent(queries.webviewGoBack)}
        disabled={!props.canGoBack}
        icon="chevron-left"
      />
      <IconButton
        onClick={() => wcEvent(queries.webviewGoForward)}
        disabled={!props.canGoForward}
        icon="chevron-right"
      />
      {loading ? (
        <IconButton onClick={() => wcEvent(queries.webviewStop)} icon="cross" />
      ) : (
        <IconButton
          onClick={() => wcEvent(queries.webviewReload)}
          icon="repeat"
        />
      )}
      <Title>{title}</Title>
      <Filler />
      <MenuTippy
        placement="bottom"
        interactive
        visible={showMenu}
        appendTo={document.body}
        content={
          <MenuContents ref={coref("menu-contents")}>
            {
              <Button
                disabled={/itch:/.test(url)}
                onClick={() => wcEvent(queries.webviewPopout)}
                label="Open page in external browser"
              />
            }
            <Button
              onClick={() => wcEvent(queries.openWebviewDevTools)}
              label="Open dev tools"
            />
          </MenuContents>
        }
      >
        <IconButton
          ref={coref("menu-button")}
          icon="more_vert"
          onClick={() => setShowMenu(!showMenu)}
        />
      </MenuTippy>
      <div className="loader-inner"></div>
    </NavDiv>
  );
};
