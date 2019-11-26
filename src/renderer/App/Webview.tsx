import { WebContents, WebviewTag } from "electron";
import { packets } from "common/packets";
import React, { useContext, useEffect, useRef, useState } from "react";
import { WebviewActionBar } from "renderer/App/WebviewActionBar";
import { WebviewNavigation } from "renderer/App/WebviewNavigation";
import { SocketContext } from "renderer/Route";
import styled from "renderer/styles";
import { Cancel } from "renderer/Socket";

const WebviewContainer = styled.div`
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
  justify-content: stretch;

  webview {
    width: 100%;
    flex-grow: 1;
  }
`;

type ExtendedWebContents = WebContents & {
  history: string[];
  currentIndex: number;
};

export const Webview = () => {
  const socket = useContext(SocketContext);
  const viewRef = useRef<WebviewTag>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState("");

  useEffect(() => {
    const wv = viewRef.current;
    if (!wv || !socket) {
      return;
    }

    wv.addEventListener("will-navigate", ev => {
      setUrl(ev.url);
    });

    let didNavigate = (url: string) => {
      console.log(`navigated to`, url);

      const wc = wv.getWebContents() as ExtendedWebContents;
      console.log(`index ${wc.currentIndex}, history `, wc.history);
      socket.send(packets.setWebviewHistory, {
        webviewHistory: {
          history: wc.history,
          currentIndex: wc.currentIndex,
        },
      });
      setUrl(url);
      setCanGoBack(wc.canGoBack());
      setCanGoForward(wc.canGoForward());
    };

    wv.addEventListener("did-navigate", ev => {
      console.log("did-navigate");
      if (/^about:blank/.test(ev.url)) {
        console.log(`initial load, restoring history`);

        // TODO: find better way
        socket.send(packets.getWebviewHistory, {});
        let cancel: Cancel;
        cancel = socket.listen(
          packets.getWebviewHistoryResult,
          ({ webviewHistory }) => {
            cancel();
            const { history, currentIndex } = webviewHistory;
            console.log(`restoring index ${currentIndex}, history `, history);
            const wc = wv.getWebContents() as ExtendedWebContents;
            wc.history = history;
            wc.goToIndex(currentIndex);
          }
        );
      } else {
        didNavigate(ev.url);
      }
    });
    wv.addEventListener("did-navigate-in-page", ev => {
      console.log("did-navigate-in-page");
      didNavigate(ev.url);
    });

    wv.addEventListener("load-commit", ev => {
      if (ev.isMainFrame) {
        setUrl(ev.url);
      }
    });
    wv.addEventListener("page-title-updated", ev => {
      setTitle(ev.title);
    });
    wv.addEventListener("did-start-loading", ev => {
      setLoading(true);
    });
    wv.addEventListener("did-stop-loading", ev => {
      setLoading(false);

      const matches = /^itch:\/\/(.*)$/.exec(wv.getURL());
      if (matches) {
        setPath(matches[1]);
      } else {
        wv.executeJavaScript(
          `
          (document.querySelector("meta[name='itch:path']") || {content: ""}).content
        `
        ).then(path => {
          console.log(`scraped path: `, path);
          setPath(path);
        });
      }
    });
  }, [viewRef, socket]);

  useEffect(() => {
    if (socket) {
      return socket.listen(packets.navigate, ({ url: href }) => {
        let wv = viewRef.current;
        if (wv) {
          wv.loadURL(href);
        }
      });
    }
    return undefined;
  }, [socket]);

  return (
    <WebviewContainer>
      <WebviewNavigation
        viewRef={viewRef}
        title={title}
        url={url}
        loading={loading}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
      />
      <webview src="about://blank" ref={viewRef} />
      <WebviewActionBar path={path} />
    </WebviewContainer>
  );
};
