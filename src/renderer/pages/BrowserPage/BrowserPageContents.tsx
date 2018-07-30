import classNames from "classnames";
import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { Dispatch, ProxySource, BrowserViewMetrics } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import newTabItems from "renderer/pages/BrowserPage/newTabItems";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { debounce, map } from "underscore";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import BrowserContext from "renderer/pages/BrowserPage/BrowserContext";
import DisabledBrowser from "renderer/pages/BrowserPage/DisabledBrowser";
import ContainerDimensions from "react-container-dimensions";

const BrowserPageDiv = styled.div`
  ${styles.meat};
`;

const BrowserMain = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  position: relative;
`;

const WebviewShell = styled.div`
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
`;

const NewTabGrid = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: flex-start;
  align-content: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1;
`;

const NewTabItem = styled.div`
  ${styles.clickable};

  width: auto;
  flex-grow: 1;
  padding: 30px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .icon {
    font-size: 70px;
    margin-bottom: 25px;
  }
`;

const Title = styled.h2`
  flex-basis: 100%;
  text-align: center;
  padding: 20px 0;
  font-size: ${props => props.theme.fontSizes.huge};
`;

class BrowserPageContents extends React.PureComponent<Props> {
  initialURL: string;

  constructor(props: BrowserPageContents["props"], context: any) {
    super(props, context);
    this.initialURL = props.url;
  }

  render() {
    const { space, url, disableBrowser } = this.props;
    const fresh = !space.web().webContentsId;
    const newTab = space.internalPage() === "new-tab";

    return (
      <BrowserPageDiv>
        <BrowserBar />
        <BrowserMain>
          {newTab ? (
            <NewTabGrid>
              <Title>{T(["new_tab.titles.buttons"])}</Title>

              {map(newTabItems, item => {
                const { label, icon, url } = item;

                return (
                  <NewTabItem
                    key={url}
                    onClick={() =>
                      this.props.dispatch(
                        actions.evolveTab({
                          tab: space.tab,
                          wind: ambientWind(),
                          url,
                          replace: true,
                        })
                      )
                    }
                  >
                    <Icon icon={icon} />
                    <span>{T(label)}</span>
                  </NewTabItem>
                );
              })}
            </NewTabGrid>
          ) : (
            <WebviewShell className={classNames({ fresh, newTab })}>
              {disableBrowser ? (
                <DisabledBrowser url={url} />
              ) : (
                <ContainerDimensions>
                  {({ width, height, top, left }) => {
                    this.setMetrics({ width, height, top, left });
                    return (
                      <div>
                        <pre
                          style={{
                            width: `${width}px`,
                            height: `${height}px`,
                            transition: "all 0.2s ease-out",
                          }}
                        >
                          {JSON.stringify(
                            { width, height, top, left },
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    );
                  }}
                </ContainerDimensions>
              )}
            </WebviewShell>
          )}
        </BrowserMain>
        <BrowserContext />
      </BrowserPageDiv>
    );
  }

  setMetrics = debounce((metrics: BrowserViewMetrics) => {
    const { space, dispatch } = this.props;
    dispatch(
      actions.tabGotWebContentsMetrics({
        wind: ambientWind(),
        tab: space.tab,
        metrics,
      })
    );
  }, 250);

  componentWillUnmount() {
    const { dispatch, space } = this.props;
    dispatch(
      actions.tabLostWebContents({
        wind: ambientWind(),
        tab: space.tab,
      })
    );
  }
}

interface Props extends MeatProps {
  space: Space;
  dispatch: Dispatch;

  url: string;

  proxy: string;
  proxySource: ProxySource;
  disableBrowser: boolean;
}

export default withSpace(
  hook(map => ({
    proxy: map(rs => rs.system.proxy),
    proxySource: map(rs => rs.system.proxySource),
    disableBrowser: map(rs => rs.preferences.disableBrowser),
  }))(BrowserPageContents)
);
