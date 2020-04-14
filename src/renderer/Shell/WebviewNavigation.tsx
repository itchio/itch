import { WebviewTag } from "electron";
import React, { useState } from "react";
import { IconButton } from "renderer/basics/IconButton";
import { animations, fontSizes } from "renderer/theme";
import styled from "styled-components";
import { ExtendedWebContents } from "common/extended-web-contents";
import { MenuTippy, MenuContents } from "renderer/basics/Menu";
import { Button } from "renderer/basics/Button";
import { useClickOutside } from "renderer/basics/use-click-outside";

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
        ${p => p.theme.colors.accent} 30%,
        ${p => p.theme.colors.accent} 70%,
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

  let withWebview = (f: (wv: WebviewTag, wc: ExtendedWebContents) => void) => {
    let wv = props.viewRef.current;
    if (wv) {
      try {
        const wc = wv.getWebContents() as ExtendedWebContents;
        f(wv, wc);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <NavDiv className={loading ? "loading" : ""}>
      <IconButton
        onClick={() =>
          withWebview((wv, wc) => {
            if (wc.currentIndex > 0) {
              wv.goToIndex(wc.currentIndex - 1);
            }
          })
        }
        disabled={!props.canGoBack}
        icon="chevron-left"
      />
      <IconButton
        onClick={() =>
          withWebview((wv, wc) => {
            if (wc.currentIndex < wc.history.length - 1) {
              wc.goToIndex(wc.currentIndex + 1);
            }
          })
        }
        disabled={!props.canGoForward}
        icon="chevron-right"
      />
      {loading ? (
        <IconButton onClick={() => withWebview(wv => wv.stop())} icon="cross" />
      ) : (
        <IconButton
          onClick={() => withWebview(wv => wv.reload())}
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
                onClick={() =>
                  withWebview(wv => {
                    window.open(wv.getURL());
                  })
                }
                label="Open page in external browser"
              />
            }
            <Button
              onClick={() =>
                withWebview((wv, wc) => {
                  wc.openDevTools({ mode: "detach" });
                  wc.devToolsWebContents?.focus();
                })
              }
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
