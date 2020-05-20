import { packets } from "common/packets";
import { queries } from "common/queries";
import { partitionForUser } from "common/util/partitions";
import { WebviewTag } from "electron";
import React, { useEffect, useRef, useState } from "react";
import { useProfile, useSocket } from "renderer/contexts";
import { WebviewNavigation } from "renderer/Shell/WebviewNavigation";
import { useListen } from "renderer/Socket";
import { useAsyncCb } from "renderer/use-async-cb";
import styled from "styled-components";
const WebviewActionBar = React.lazy(() =>
  import("renderer/Shell/WebviewActionBar")
);

const WebviewContainer = styled.div`
  width: 100%;
  height: 100%;

  background: ${(p) => p.theme.colors.shellBg};

  display: flex;
  flex-direction: column;
  justify-content: stretch;

  webview {
    width: 100%;
    flex-grow: 1;
  }
`;

export interface WebviewProps {
  url: string;
}

export const Webview = (props: WebviewProps) => {
  const socket = useSocket();
  const profile = useProfile();
  const viewRef = useRef<WebviewTag>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [url, setUrl] = useState(props.url);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState("");

  let [saveWebviewState] = useAsyncCb(
    async (wcId: number) => {
      await socket.query(queries.saveWebviewState, { wcId });
    },
    [socket]
  );

  useEffect(() => {
    const wv = viewRef.current;
    if (!wv) {
      return;
    }

    wv.addEventListener("will-navigate", (ev) => {
      setUrl(ev.url);
    });

    let didNavigate = (url: string) => {
      saveWebviewState(wv.getWebContentsId());
      setUrl(url);
      setCanGoBack(wv.canGoBack());
      setCanGoForward(wv.canGoForward());
    };

    wv.addEventListener("did-navigate", (ev) => {
      if (/^about:blank/.test(ev.url)) {
        (async () => {
          try {
            await socket.query(queries.restoreWebviewState, {
              wcId: wv.getWebContentsId(),
            });
          } catch (e) {
            console.error(e);
            // alert(`Something went very wrong:\n\n${e.stack}`);
          }
        })();
      } else {
        didNavigate(ev.url);
      }
    });
    wv.addEventListener("did-navigate-in-page", (ev) => {
      didNavigate(ev.url);
    });

    wv.addEventListener("load-commit", (ev) => {
      if (ev.isMainFrame) {
        setUrl(ev.url);
      }
    });
    wv.addEventListener("page-title-updated", (ev) => {
      setTitle(ev.title);
    });
    wv.addEventListener("did-start-loading", () => {
      setLoading(true);
    });
    wv.addEventListener("did-stop-loading", () => {
      setLoading(false);

      const matches = /^itch:\/\/(.*)$/.exec(wv.getURL());
      if (matches) {
        setPath(matches[1]);
      } else {
        wv.executeJavaScript(
          `
          (document.querySelector("meta[name='itch:path']") || {content: ""}).content
        `
        ).then((path) => {
          setPath(path);
        });
      }
    });
  }, [saveWebviewState, socket, viewRef]);

  let viewRefCurrent = viewRef.current;
  const [domReady, setDomReady] = useState(false);
  useEffect(() => {
    viewRefCurrent?.addEventListener("dom-ready", () => {
      setDomReady(true);
    });
  }, [setDomReady, viewRefCurrent]);

  useListen(
    socket,
    packets.navigate,
    ({ url: href }) => {
      if (!domReady) {
        console.warn(`Webview not ready yet, ignoring: ${href}`);
        return;
      }

      viewRef.current?.loadURL(href);
    },
    [domReady]
  );

  return (
    <WebviewContainer className="webview-container">
      <WebviewNavigation
        viewRef={viewRef}
        title={title}
        url={url}
        loading={loading}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
      />
      <webview
        onFocus={onWebviewFocus}
        src={props.url}
        partition={partitionForUser(profile!.user.id)}
        ref={viewRef}
        webpreferences="nativeWindowOpen"
      />
      <WebviewActionBar path={path} />
    </WebviewContainer>
  );
};

function onWebviewFocus() {
  // When clicking on a webview, no "click" event is generated,
  // so we generate our own.
  //
  // See `useClickOutside`
  document.dispatchEvent(new Event("click-outside"));
}
