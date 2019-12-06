import { WebviewTag } from "electron";
import React from "react";
import { IconButton } from "renderer/basics/IconButton";
import { ExtendedWebContents } from "renderer/Shell/Webview";
import { animations, fontSizes } from "renderer/theme";
import styled from "styled-components";

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
  font-size: ${fontSizes.large};
  padding-left: 1em;
`;

export const WebviewNavigation = (props: Props) => {
  const { title, url, loading } = props;

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
        icon="arrow-left"
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
        icon="arrow-right"
      />
      <IconButton
        onClick={() => withWebview(wv => wv.reload())}
        icon="repeat"
      />
      <Title>{title}</Title>
      <Filler />
      <IconButton
        onClick={() => withWebview(wv => wv.openDevTools())}
        icon="bug"
      />
      <div className="loader-inner"></div>
    </NavDiv>
  );
};
