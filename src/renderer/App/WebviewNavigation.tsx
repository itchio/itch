import { WebviewTag } from "electron";
import React, { useState } from "react";
import styled, { animations } from "renderer/styles";
import { IconButton } from "renderer/basics/IconButton";

const NavDiv = styled.div`
  color: ${props => props.theme.baseText};

  display: flex;
  flex-direction: column;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 10px;
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
        ${props => props.theme.accent} 30%,
        ${props => props.theme.accent} 70%,
        transparent 70%,
        transparent 100%
      );
      animation: ${animations.horizontalIndeterminate} 2.4s ease-in-out infinite;
    }
  }
`;

const TitleBar = styled.div`
  font-size: 16px;

  height: 36px;
  line-height: 36px;
  vertical-align: middle;

  padding: 0 10px;
`;

const AddressBar = styled.div`
  border: 1px solid ${props => props.theme.inputBorder};
  padding: 0 10px;

  border-radius: 2px;
  height: 36px;
  line-height: 36px;
  vertical-align: middle;

  flex-grow: 1;
  max-width: 600px;

  input {
    margin: 0;
    width: 100%;
    height: 100%;
    line-height: 100%;
    background: transparent;
    border: none;
  }

  &,
  input {
    font-size: 14px;
    color: ${props => props.theme.baseText};
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

export const WebviewNavigation = (props: Props) => {
  const [editing, setEditing] = useState(false);
  const { title, url, loading } = props;
  let withWebview = (f: (wv: WebviewTag) => void) => (...args: any[]) => {
    if (props.viewRef.current) {
      f(props.viewRef.current);
    }
  };

  return (
    <NavDiv>
      <TitleBar>{title}</TitleBar>
      <Controls className={loading ? "loading" : ""}>
        <IconButton
          onClick={withWebview(wv => {
            var wc = wv.getWebContents() as ExtendedWebContents;
            console.log(
              `going back, currently ${wc.currentIndex}, history `,
              wc.history
            );
            if (wc.currentIndex > 0) {
              wv.goToIndex(wc.currentIndex - 1);
            }
          })}
          disabled={!props.canGoBack}
          icon="arrow-left"
        />
        <IconButton
          onClick={withWebview(wv => {
            var wc = wv.getWebContents() as ExtendedWebContents;
            if (wc.currentIndex < wc.history.length - 1) {
              wv.goToIndex(wc.currentIndex + 1);
            }
          })}
          disabled={!props.canGoForward}
          icon="arrow-right"
        />
        <IconButton onClick={withWebview(wv => wv.reload())} icon="repeat" />
        <AddressBar onClick={() => setEditing(true)}>
          {editing ? (
            <input
              autoFocus
              defaultValue={url}
              onBlur={() => setEditing(false)}
              onKeyPress={ev => {
                if (ev.key === "Enter") {
                  let url = ev.currentTarget.value;
                  console.log(`navigating to`, url);
                  if (props.viewRef.current) {
                    props.viewRef.current.loadURL(url);
                  }
                  setEditing(false);
                } else {
                  console.log(ev.key);
                }
              }}
            ></input>
          ) : /^about:/.test(url) ? (
            ""
          ) : (
            url
          )}
        </AddressBar>
        <IconButton onClick={withWebview(wv => wv.openDevTools())} icon="cog" />
        <div className="loader-inner"></div>
      </Controls>
    </NavDiv>
  );
};
