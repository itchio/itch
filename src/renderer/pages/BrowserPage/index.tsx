import classNames from "classnames";
import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import {
  Dispatch,
  ProxySource,
  BrowserViewMetrics,
  WebviewScreenshot,
} from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import BrowserContext from "renderer/pages/BrowserPage/BrowserContext";
import DisabledBrowser from "renderer/pages/BrowserPage/DisabledBrowser";
import ContainerDimensions from "react-container-dimensions";
import { ipcRenderer } from "electron";

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

  &.fresh {
    background-color: ${props => props.theme.sidebarBackground};
    background-image: url("${require("static/images/logos/app-white.svg")}");
    background-position: 50% 50%;
    background-repeat: no-repeat;
  }

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
    this.initialURL = props.space.url();
  }

  render() {
    const { space, disableBrowser, visible } = this.props;
    if (space.isSleepy() && !visible) {
      return null;
    }
    const fresh = !space.web().hadFirstLoad;

    return (
      <BrowserPageDiv>
        <BrowserBar />
        <BrowserMain>
          <BrowserViewShell className={classNames({ fresh })}>
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
      const { space, dispatch } = this.props;
      dispatch(space.makeFetch({ web: { loading: false } }));
    }
  }

  setMetrics = (metrics: BrowserViewMetrics) => {
    if (!this.mounted) {
      return;
    }
    const { space, dispatch } = this.props;
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
      } else {
        console.log(`canvas already has proper size`);
      }
    }
    dispatch(
      actions.tabGotWebContentsMetrics({
        wind: ambientWind(),
        tab: space.tab,
        initialURL: this.initialURL,
        metrics,
      })
    );
  };

  componentDidMount() {
    // This is sent asynchronously by the main process
    // when it's about to hide the BrowserView.
    ipcRenderer.addListener(
      "made-webview-screenshot",
      this.onMadeWebviewScreenshot
    );
    this.mounted = true;
  }

  onMadeWebviewScreenshot = (ev: any, payload: WebviewScreenshot) => {
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
    // main sends us an asynchronous message, so it expects us
    // to reply before going on with its regular business.
    // hopefully this all happens very fast and we don't
    // run into any nasty race conditions. in practice, it'll
    // probably happen a few times.
    ipcRenderer.send("received-webview-screenshot");
  };

  gotCanvas = (canvas: HTMLCanvasElement) => {
    this.canvas = canvas;
  };

  componentWillUnmount() {
    this.mounted = false;
    ipcRenderer.removeListener(
      "made-webview-screenshot",
      this.onMadeWebviewScreenshot
    );
    const { dispatch, space } = this.props;
    dispatch(
      actions.tabLosingWebContents({
        wind: ambientWind(),
        tab: space.tab,
      })
    );
  }
}

interface Props extends MeatProps {
  space: Space;
  dispatch: Dispatch;

  proxy: string;
  proxySource: ProxySource;
  disableBrowser: boolean;
}

export default withSpace(
  hook(map => ({
    proxy: map(rs => rs.system.proxy),
    proxySource: map(rs => rs.system.proxySource),
    disableBrowser: map(rs => rs.preferences.disableBrowser),
  }))(BrowserPage)
);
