import classNames from "classnames";
import { actions } from "common/actions";
import env from "renderer/env";
import { Space } from "common/helpers/space";
import { titleBarHeight } from "common/constants/windows";
import { ExtendedWindow, TabInstance } from "common/types";
import { Dispatch } from "common/types";
import { ambientWind, ambientWindState } from "common/util/navigation";
import React from "react";
import NewVersionAvailable from "renderer/basics/TitleBar/NewVersionAvailable";
import UserMenu from "renderer/basics/TitleBar/UserMenu";
import { hookWithProps } from "renderer/hocs/hook";
import modals from "renderer/modals";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { isSecretClick } from "common/helpers/secret-click";

const DraggableDiv = styled.div`
  ${styles.singleLine};
  -webkit-app-region: drag;

  flex: 1 1;
  display: flex;
  align-self: stretch;
`;

const Spacer = styled.div`
  width: 8px;
  flex-shrink: 0;
`;

const DraggableDivInner = styled.div`
  flex: 1 1;
  display: flex;
  align-self: center;
  align-items: center;
  max-width: 100%;
`;

const Filler = styled.div`
  flex: 1 1;
`;

/*
 * Window controls are native (macOS traffic lights / titleBarOverlay
 * elsewhere) and float above the page in window coordinates, so we inset
 * with the titlebar-area env vars. The env fallbacks make both insets
 * resolve to 0 where there's no overlay (macOS).
 */
const TitleBarDiv = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background: ${(props) => props.theme.sidebarBackground};
  padding-left: 10px;
  height: ${titleBarHeight}px;

  padding-right: calc(
    100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw)
  );

  /* when no sidebar sits to our left, controls may also cover our left edge */
  &.full-width {
    padding-left: max(10px, env(titlebar-area-x, 0px));
  }
`;

const TitleDiv = styled.div`
  ${styles.singleLine};

  font-size: ${(props) => props.theme.fontSizes.large};
`;

const emptyObj = {};

class TitleBar extends React.PureComponent<Props> {
  override render() {
    const { tab, macos, tabInstance } = this.props;
    const iw = (window as unknown as ExtendedWindow).windSpec;
    const secondary = iw.role == "secondary";

    const sp = Space.fromInstance(tab, tabInstance);
    let label = sp.lazyLabel();

    const loggedIn = tab !== "login";
    if (!loggedIn) {
      if (macos) {
        label = "";
      } else {
        label = env.appName;
      }
    }

    return (
      <TitleBarDiv
        className={classNames("title-bar", {
          "full-width": secondary || !loggedIn,
        })}
      >
        <DraggableDiv id="title-draggable" onClick={this.onClick}>
          <DraggableDivInner>
            {secondary ? <Filler /> : null}
            <TitleDiv className="title-bar-text">{T(label)}</TitleDiv>
            <Filler />
          </DraggableDivInner>
        </DraggableDiv>
        {secondary ? null : (
          <>
            {loggedIn ? <UserMenu /> : null}
            <NewVersionAvailable />
          </>
        )}
        <Spacer />
      </TitleBarDiv>
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    if (isSecretClick(e)) {
      const { dispatch } = this.props;
      dispatch(
        actions.openModal(
          modals.secretSettings.make({
            wind: ambientWind(),
            title: "Secret settings",
            message: "",
            widgetParams: {},
          })
        )
      );
      return;
    }
  };
}

interface Props {
  tab: string;

  dispatch: Dispatch;
  tabInstance: TabInstance;
  macos: boolean;
}

export default hookWithProps(TitleBar)((map) => ({
  tabInstance: map(
    (rs, props) => ambientWindState(rs).tabInstances[props.tab] || emptyObj
  ),
  macos: map((rs, props) => rs.system.macos),
}))(TitleBar);
