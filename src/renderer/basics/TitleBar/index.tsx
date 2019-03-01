import { actions } from "common/actions";
import env from "common/env";
import { Space } from "common/helpers/space";
import { ExtendedWindow, TabInstance } from "common/types";
import { Dispatch } from "common/types";
import { ambientWind, ambientWindState } from "common/util/navigation";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import NewVersionAvailable from "renderer/basics/TitleBar/NewVersionAvailable";
import UserMenu from "renderer/basics/TitleBar/UserMenu";
import { hookWithProps } from "renderer/hocs/hook";
import { modals } from "common/modals";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { isSecretClick } from "common/helpers/secret-click";
import { theme } from "@jakejarrett/gtk-theme";

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

export const titleBarHeight = 40;

const WindowButton = styled(IconButton)`
  align-self: flex-start;
  flex-shrink: 0;
  width: ${titleBarHeight * 1.1}px;
  height: ${titleBarHeight * 0.8}px;
  opacity: 0.7;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  &.exit:hover {
    background: rgba(174, 8, 7, 1);
  }
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

const TitleBarDiv = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background: ${props => props.theme.sidebarBackground};
  padding-left: 10px;
  height: ${titleBarHeight}px;
`;

const TitleDiv = styled.div`
  ${styles.singleLine};

  font-size: ${props => props.theme.fontSizes.large};
`;

const emptyObj = {};

class TitleBar extends React.PureComponent<Props> {
  render() {
    const { tab, macos, tabInstance, linux } = this.props;
    const iw = (window as ExtendedWindow).windSpec;
    const secondary = iw.role == "secondary";
    let iconSide = "right";
    if (linux) {
      iconSide = theme.button_layout;
      console.log(theme);
    }

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
      <TitleBarDiv className="title-bar">
        {iconSide === "left" && (
          <>
            {this.renderIcons()}
            <Spacer />
          </>
        )}
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
        {iconSide !== "left" && (
          <>
            <Spacer />
            {this.renderIcons()}
          </>
        )}
      </TitleBarDiv>
    );
  }

  renderIcons() {
    const { maximized, linux, windows } = this.props;
    let toRender = null;
    const iw = (window as ExtendedWindow).windSpec;
    const secondary = iw.role == "secondary";

    if (windows) {
      toRender = this.renderWindowsIcons(secondary, maximized);
    }

    if (linux) {
      toRender = this.renderGtkIcons(maximized);
    }

    return toRender;
  }

  private renderWindowsIcons(secondary, maximized) {
    return (
      <>
        {secondary ? null : (
          <>
            <WindowButton icon="minus" onClick={this.minimizeClick} />
            <WindowButton
              icon={maximized ? "window-restore" : "window-maximize"}
              onClick={this.maximizeRestoreClick}
            />
          </>
        )}
        <WindowButton className="exit" icon="cross" onClick={this.closeClick} />
      </>
    );
  }

  /**
   * Determine the button we should render
   *
   * @param icon {string} - Icon we're rendering
   * @param maximized - Whether or not it is maximized.
   */
  private convertGtkToItchButton(icon: GtkButtonType, maximized: boolean) {
    switch (icon) {
      case "close": {
        return {
          className: "exit",
          icon: "cross",
          onClick: this.closeClick,
        };
      }

      case "minimize": {
        return {
          icon: "minus",
          onClick: this.minimizeClick,
        };
      }

      case "maximize": {
        return {
          icon: maximized ? "window-restore" : "window-maximize",
          onClick: this.maximizeRestoreClick,
        };
      }
    }
  }

  /**
   * Grabs what icons to render from GTK and then renders the appropriate icons
   */
  private renderGtkIcons(maximized) {
    const { gtk_decoration_layout } = theme;
    let supported = gtk_decoration_layout.split(",");
    supported = supported.filter(button => button.indexOf(":") === -1);

    return (
      <>
        {supported.map(buttonType => (
          <WindowButton
            {...this.convertGtkToItchButton(buttonType, maximized)}
            key={buttonType}
          />
        ))}
      </>
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

  preferencesClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.navigate({ wind: "root", url: "itch://preferences" }));
  };

  minimizeClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.minimizeWind({ wind: ambientWind() }));
  };

  maximizeRestoreClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.toggleMaximizeWind({ wind: ambientWind() }));
  };

  closeClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.hideWind({ wind: ambientWind() }));
  };
}

interface GtkButtons {
  layout: "right" | "left";
  supported: string[];
}

type GtkButtonType = "minimize" | "maximize" | "close";

interface Props {
  tab: string;
  secondary?: boolean;

  dispatch: Dispatch;
  tabInstance: TabInstance;
  maximized: boolean;
  focused: boolean;
  macos: boolean;
  linux: boolean;
  windows: boolean;

  buttons: GtkButtons;
}

export default hookWithProps(TitleBar)(map => ({
  tabInstance: map(
    (rs, props) => ambientWindState(rs).tabInstances[props.tab] || emptyObj
  ),
  maximized: map((rs, props) => rs.winds[ambientWind()].native.maximized),
  focused: map((rs, props) => rs.winds[ambientWind()].native.focused),
  macos: map((rs, props) => rs.system.macos),
  windows: map((rs, props) => rs.system.windows),
  linux: map((rs, props) => rs.system.linux),
  buttons: map((rs, props) => ({ layout: theme.button_layout })),
}))(TitleBar);
