import classNames from "classnames";
import { actions } from "common/actions";
import * as colors from "common/constants/colors";
import { specToButton } from "common/helpers/spec-to-button";
import {
  Action,
  RootState,
  Modal,
  ModalButton,
  ModalButtonSpec,
  Dispatch,
} from "common/types";
import { rendererWindow, rendererWindowState } from "common/util/navigation";
import { stripUnit } from "polished";
import React from "react";
import { InjectedIntl, injectIntl } from "react-intl";
import Button from "renderer/basics/Button";
import Cover from "renderer/basics/Cover";
import Filler from "renderer/basics/Filler";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import Markdown from "renderer/basics/Markdown";
import RowButton, {
  BigButtonContent,
  BigButtonRow,
  Tag,
} from "renderer/basics/RowButton";
import TimeAgo from "renderer/basics/TimeAgo";
import { connect } from "renderer/hocs/connect";
import watching, { Watcher } from "renderer/hocs/watching";
import { withDispatch } from "renderer/hocs/withDispatch";
import Hoverable from "renderer/hocs/withHover";
import { modalWidgets, ModalWidgetSpec } from "renderer/modal-widgets";
import styled, * as styles from "renderer/styles";
import { T, TString } from "renderer/t";
import { createStructuredSelector } from "reselect";
import { filter, isEmpty, map } from "underscore";

const HoverCover = Hoverable(Cover);

type Flavor = "normal" | "big";

const ModalPortalDiv = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(7, 4, 4, 0.74);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  animation: ${styles.animations.fadeIn} 0.2s;

  .content {
    min-width: 50%;
    max-width: 90%;
    max-height: 80%;
    overflow-y: auto;

    &.fullscreen {
      min-width: 100%;
      max-width: 100%;
      min-height: 100%;
      max-height: 100%;
      position: relative;

      .modal-div {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
    }

    padding: 0px;
    background-color: ${colors.darkMineShaft};
    border: 1px solid ${colors.lightMineShaft};
    border-radius: 2px;
    box-shadow: 0 0 32px black;
    z-index: 200;
  }
`;

const ModalsDiv = styled.div`
  min-width: 200px;
  min-height: 200px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;

  .big-wrapper {
    display: flex;
    flex-direction: row;

    .cover-container,
    .cover {
      width: 120px;
      margin-bottom: 20px;
    }

    .cover-container {
      flex: 1 0;
      align-self: flex-start;
      margin-left: 20px;
      margin-top: 20px;
    }

    .buttons {
      flex-grow: 1;
    }
  }

  .body {
    margin-top: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: stretch;
    line-height: 1.6;

    ul {
      list-style-type: disc;
      margin-bottom: 1.5em;

      li {
        margin-left: 1.5em;
      }
    }

    .message {
      padding: 0 20px;
      overflow-y: auto;
      max-height: 460px;
      -webkit-user-select: initial;

      h1,
      h2,
      h3,
      h4,
      h5,
      h6 {
        margin-bottom: 0.4em;
        font-size: ${props => stripUnit(props.theme.fontSizes.baseText) + 2}px;
        font-weight: bold;
      }

      a {
        color: darken($ivory, 5%);

        &:hover {
          color: $ivory;
          cursor: pointer;
        }
      }

      p img {
        max-width: 100%;
      }

      code {
        font-family: monospace;
      }

      .secondary {
        color: ${props => props.theme.secondaryText};
      }

      strong {
        font-weight: bold;
      }
    }

    p {
      line-height: 1.4;
      margin: 8px 0;
    }

    .icon {
      margin-top: 8px;
      margin-right: 12px;
      font-size: 48px;
    }
  }

  .buttons {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 20px;
    padding-bottom: 0;

    &.flavor-big {
      flex-direction: column;
      align-items: stretch;
      padding: 8px 20px;
      max-height: 300px;
      overflow-y: auto;

      .button {
        transition: -webkit-filter 0.2s;
        font-weight: bold;
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.58);

        &:not(.action-play) {
          -webkit-filter: grayscale(100%) brightness(70%);
        }

        &:hover {
          -webkit-filter: brightness(110%);
        }

        &,
        &.secondary {
          display: flex;
          align-items: center;
          margin: 8px 0;
          font-size: 16px;
          padding: 14px 14px;
        }

        .tag {
          margin: 0 0 0 7px;
          font-size: 80%;
          padding: 5px 4px;
          border-radius: 4px;
          background: #fffff0;
          color: $button-background-color;
          text-shadow: none;
        }

        .icon {
          margin-right: 10px;
        }
      }
    }
  }
`;

const HeaderDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};
  padding: 8px;
  padding-left: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  position: relative;

  min-height: 2.6em;

  .draggable {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 60px;
    -webkit-app-region: drag;
  }

  .title {
    color: ${props => props.theme.secondaryText};
    font-size: ${props => props.theme.fontSizes.large};
  }
`;

const ButtonsDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 20px;

  & > * {
    margin-left: 8px;
  }
`;

const BigButtonsDiv = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  width: 100%;
  justify-content: stretch;

  & > * {
    margin-bottom: 12px;
  }
`;

@watching
class Modals extends React.PureComponent<Props & DerivedProps, State> {
  constructor(props: Modals["props"], context: any) {
    super(props, context);
    this.state = {
      widgetPayload: null,
    };
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.commandOk, async (store, action) => {
      const { modal } = this.props;
      if (!modal) {
        return;
      }

      if (modal.bigButtons && !isEmpty(modal.bigButtons)) {
        // 'ok' does nothing when there's big buttons
        return;
      }

      if (modal.buttons && !isEmpty(modal.buttons)) {
        let primaryButtons = map(modal.buttons, specToButton);
        primaryButtons = filter(
          primaryButtons,
          b => !b.className || !/secondary/.test(b.className)
        );
        // if there's more than one primary button, or none at all, 'ok' does nothing
        if (primaryButtons.length === 1) {
          const onClick = this.buttonOnClick(primaryButtons[0]);
          onClick();
        }
      }
    });
  }

  render() {
    const { modal } = this.props;
    if (!modal) {
      return null;
    }

    return (
      <ModalPortalDiv>
        <div
          className={classNames("content", { fullscreen: modal.fullscreen })}
        >
          {this.renderContent()}
        </div>
      </ModalPortalDiv>
    );
  }

  renderContent() {
    const { modal, dispatch, intl } = this.props;

    if (!modal) {
      return null;
    }

    const {
      bigButtons = [],
      buttons = [],
      title = "",
      message = "",
      detail,
      widget,
    } = modal;
    return (
      <ModalsDiv className="modal-div">
        <HeaderDiv>
          <div className="draggable" />
          <span className="title" onClick={this.onDebugClick}>
            {T(title)}
          </span>
          <Filler />
          {modal.unclosable ? null : (
            <IconButton
              icon="cross"
              onClick={() =>
                dispatch(
                  actions.closeModal({
                    window: rendererWindow(),
                  })
                )
              }
            />
          )}
        </HeaderDiv>

        {message !== "" ? (
          <div className="body">
            <div className="message">
              <div>
                <Markdown source={TString(intl, message)} />
              </div>
              {detail && (
                <div className="secondary">
                  <Markdown source={TString(intl, detail)} />
                </div>
              )}
            </div>
          </div>
        ) : null}

        {bigButtons.length > 0 ? (
          <div className="big-wrapper">
            {this.renderCover(modal)}
            {this.renderButtons(bigButtons, "big")}
          </div>
        ) : null}

        {widget ? this.renderWidget(widget, modal) : null}

        {this.renderButtons(buttons, "normal")}
      </ModalsDiv>
    );
  }

  onDebugClick = (e: React.MouseEvent<any>) => {
    if (e.shiftKey && e.ctrlKey) {
      const { dispatch } = this.props;
      dispatch(
        actions.openModal(
          modalWidgets.exploreJson.make({
            window: "root",
            title: "Modal payload",
            message: "",
            widgetParams: {
              data: this.props.modal,
            },
            fullscreen: true,
          })
        )
      );
      return;
    }
  };

  renderCover(modal: Modal): JSX.Element | null {
    const { coverUrl, stillCoverUrl } = modal;

    if (!(stillCoverUrl || coverUrl)) {
      return null;
    }

    return (
      <div className="cover-container">
        <HoverCover
          gameId={0}
          className="cover"
          coverUrl={coverUrl}
          stillCoverUrl={stillCoverUrl}
        />
      </div>
    );
  }

  renderButtons(buttons: ModalButtonSpec[], flavor: Flavor) {
    if (buttons.length === 0) {
      return null;
    }

    switch (flavor) {
      case "big":
        return this.renderBigButtons(buttons);
      case "normal":
        return this.renderNormalButtons(buttons);
      default:
        return <div>?</div>;
    }
  }

  renderBigButtons(buttons: ModalButtonSpec[]) {
    return (
      <BigButtonsDiv>
        {map(buttons, (buttonSpec, index) => {
          const button = specToButton(buttonSpec);
          const { label, className = "", icon, id, tags, timeAgo } = button;
          let onClick = this.buttonOnClick(button);

          return (
            <RowButton
              id={id}
              ink={false}
              className={className}
              key={index}
              icon={icon}
              onClick={onClick}
            >
              <BigButtonContent>
                <BigButtonRow>{T(label)}</BigButtonRow>

                {tags || timeAgo ? (
                  <BigButtonRow>
                    {tags
                      ? map(tags, tag => {
                          return (
                            <Tag>
                              {tag.icon ? <Icon icon={tag.icon} /> : null}
                              {tag.label ? T(tag.label) : null}
                            </Tag>
                          );
                        })
                      : null}
                    {timeAgo ? (
                      <Tag>
                        <TimeAgo date={timeAgo.date} />
                      </Tag>
                    ) : null}
                  </BigButtonRow>
                ) : null}
              </BigButtonContent>
            </RowButton>
          );
        })}
      </BigButtonsDiv>
    );
  }

  renderNormalButtons(buttons: ModalButtonSpec[]) {
    return (
      <ButtonsDiv>
        <Filler />
        {map(buttons, (buttonSpec, index) => {
          const button = specToButton(buttonSpec);
          const { label, className = "", icon, id } = button;
          let onClick = this.buttonOnClick(button);

          return (
            <Button
              id={id}
              primary={className !== "secondary"}
              discreet
              key={index}
              onClick={onClick}
              icon={icon}
              label={T(label)}
            />
          );
        })}
      </ButtonsDiv>
    );
  }

  buttonOnClick(button: ModalButton): () => void {
    const { dispatch } = this.props;
    const { action } = button;

    let onClick: () => void;
    if (action === "widgetResponse") {
      onClick = () => {
        const action = actions.modalResponse(this.state.widgetPayload);
        dispatch(actions.closeModal({ window: rendererWindow(), action }));
      };
    } else {
      onClick = () =>
        dispatch(
          actions.closeModal({
            window: rendererWindow(),
            action: action as Action<any>,
          })
        );
    }
    return onClick;
  }

  renderWidget(widget: string, modal: Modal): JSX.Element {
    const modalWidgetMap = modalWidgets as {
      [key: string]: ModalWidgetSpec<any, any>;
    };
    const Component = modalWidgetMap[widget].component;
    if (!Component) {
      return null;
    }
    return <Component modal={modal} updatePayload={this.updatePayload} />;
  }

  updatePayload = (payload: typeof actions.modalResponse.payload) => {
    this.setState({ widgetPayload: payload });
  };
}

interface Props {
  dispatch: Dispatch;
}

interface DerivedProps {
  modal: Modal;
  intl: InjectedIntl;
}

interface State {
  widgetPayload?: typeof actions.modalResponse.payload;
}

export default withDispatch(
  connect<Props>(
    injectIntl(Modals),
    {
      state: createStructuredSelector({
        modal: (rs: RootState) => rendererWindowState(rs).modals[0],
      }),
    }
  )
);
