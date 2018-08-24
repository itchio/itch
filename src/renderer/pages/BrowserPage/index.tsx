import { actions } from "common/actions";
import {
  BrowserViewMetrics,
  ClearBrowserScreenshot,
  Dispatch,
  ProxySource,
  SetBrowserScreenshot,
} from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import { ipcRenderer } from "electron";
import React from "react";
import ContainerDimensions from "react-container-dimensions";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import BrowserContext from "renderer/pages/BrowserPage/BrowserContext";
import DisabledBrowser from "renderer/pages/BrowserPage/DisabledBrowser";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import {
  dispatchTabLoadingStateChanged,
  dispatchTabGotWebContentsMetrics,
  dispatchTabLosingWebContents,
} from "renderer/hocs/tab-utils";

const BrowserPageDiv = styled.div`
  ${styles.meat};
`;

const BrowserMain = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  position: relative;
`;

const BrowserViewShell = styled.div`
  background: white;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  canvas {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
`;

class BrowserPage extends React.PureComponent<Props> {
  initialURL: string;
  mounted: boolean;
  canvas: HTMLCanvasElement;

  constructor(props: BrowserPage["props"], context: any) {
    super(props, context);
    this.initialURL = props.url;
  }

  render() {
    const { sleepy, disableBrowser, visible } = this.props;
    if (sleepy && !visible) {
      return null;
    }

    return (
      <BrowserPageDiv>
        <BrowserBar />
        <BrowserMain>
          <BrowserViewShell>
            {disableBrowser ? (
              <DisabledBrowser />
            ) : (
              <>
                <canvas ref={this.gotCanvas} />
                <ContainerDimensions>
                  {({ width, height, top, left }) => {
                    this.setMetrics({ width, height, top, left });
                    return <></>;
                  }}
                </ContainerDimensions>
              </>
            )}
          </BrowserViewShell>
        </BrowserMain>
        <BrowserContext />
      </BrowserPageDiv>
    );
  }

  componentDidUpdate(prevProps: Props, prevState: any) {
    if (!prevProps.disableBrowser && this.props.disableBrowser) {
      dispatchTabLoadingStateChanged(this.props, false);
    }
  }

  setMetrics = (metrics: BrowserViewMetrics) => {
    if (!this.mounted) {
      return;
    }
    if (this.canvas) {
      // Setting canvas.{width,height} clears the canvas
      // to all white, so we only really want to do it if the
      // size is not already correct.
      if (
        this.canvas.width != metrics.width ||
        this.canvas.height != metrics.height
      ) {
        // Also, we need to set the size directly because styling
        // it via CSS will just stretch the contents, not change
        // the resolution we can work with.
        this.canvas.width = metrics.width;
        this.canvas.height = metrics.height;
      }
    }
    dispatchTabGotWebContentsMetrics(this.props, {
      initialURL: this.initialURL,
      metrics,
    });
  };

  componentDidMount() {
    // This is sent asynchronously by the main process
    // when it's about to hide the BrowserView.
    ipcRenderer.addListener(
      "set-browser-screenshot",
      this.onSetBrowserScreenshot
    );
    ipcRenderer.addListener(
      "clear-browser-screenshot",
      this.onClearBrowserScreenshot
    );
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
    ipcRenderer.removeListener(
      "set-browser-screenshot",
      this.onSetBrowserScreenshot
    );
    ipcRenderer.removeListener(
      "clear-browser-screenshot",
      this.onClearBrowserScreenshot
    );
    dispatchTabLosingWebContents(this.props);
  }

  onSetBrowserScreenshot = (ev: any, payload: SetBrowserScreenshot) => {
    if (payload.tab !== this.props.tab) {
      return;
    }

    if (this.canvas) {
      const ctx = this.canvas.getContext("2d");
      const { bitmap, size } = payload;
      const { width, height } = size;
      const arr = new Uint8ClampedArray(bitmap.length);
      // The bitmap data we receive is BGRA, see
      // https://github.com/electron/electron/issues/12625
      // so we need to swizzle it.
      // Note that the result is still not 100% correct, it
      // looks a bit reddish compared to the original, but I(amos)'m
      // not sure how to fix that.
      for (let i = 0; i < bitmap.length; i += 4) {
        arr[i + 0] = bitmap[i + 2];
        arr[i + 1] = bitmap[i + 1];
        arr[i + 2] = bitmap[i + 0];
        arr[i + 3] = bitmap[i + 3];
      }
      const data = new ImageData(arr, width, height);
      ctx.putImageData(data, 0, 0);
    }
  };

  onClearBrowserScreenshot = (ev: any, payload: ClearBrowserScreenshot) => {
    if (payload.tab !== this.props.tab) {
      return;
    }

    if (this.canvas) {
      // this clears the canvas to white. Yay HTML5!
      this.canvas.width = this.canvas.width;
    }
  };

  gotCanvas = (canvas: HTMLCanvasElement) => {
    this.canvas = canvas;
    if (this.canvas) {
      let ctx = canvas.getContext("2d");
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  url: string;
  sleepy: boolean;
  loading: boolean;

  proxy: string;
  proxySource: ProxySource;
  disableBrowser: boolean;
}

export default withTab(
  hookWithProps(BrowserPage)(map => ({
    url: map((rs, props) => ambientTab(rs, props).location.url),
    sleepy: map((rs, props) => ambientTab(rs, props).sleepy),
    loading: map((rs, props) => ambientTab(rs, props).loading),

    proxy: map(rs => rs.system.proxy),
    proxySource: map(rs => rs.system.proxySource),
    disableBrowser: map(rs => rs.preferences.disableBrowser),
  }))(BrowserPage)
);
