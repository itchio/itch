import * as React from "react";
import { connect } from "./connect";
import { createStructuredSelector } from "reselect";

import ReactModal = require("react-modal");
import Button from "./basics/button";
import RowButton, { Tag } from "./basics/row-button";
import IconButton from "./basics/icon-button";
import Icon from "./basics/icon";
import Markdown from "./basics/markdown";
import Filler from "./basics/filler";
import TimeAgo from "./basics/time-ago";
import Cover from "./basics/cover";
import Hoverable from "./basics/hover-hoc";
const HoverCover = Hoverable(Cover);

import colors from "../constants/colors";

import * as actions from "../actions";
import { map } from "underscore";

import { IModal, IModalButtonSpec, IModalButton, IModalAction } from "../types";
import { IModalResponsePayload } from "../constants/action-types";

import { IModalWidgetProps } from "./modal-widgets/modal-widget";

import watching, { Watcher } from "./watching";
import styled, * as styles from "./styles";
import { stripUnit } from "polished";

import format, { formatString } from "./format";
import { InjectedIntl, injectIntl } from "react-intl";

type Flavor = "normal" | "big";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(7, 4, 4, 0.75)",
  },
  content: {
    top: "50%",
    left: "50%",
    minWidth: "50%",
    maxWidth: "90%",
    maxHeight: "80%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: "0px",
    backgroundColor: colors.darkMineShaft,
    border: `1px solid ${colors.lightMineShaft}`,
    borderRadius: "2px",
    boxShadow: "0 0 16px black",
    zIndex: 400,
  },
};

const ModalDiv = styled.div`
  min-width: 200px;
  min-height: 200px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .big-wrapper {
    display: flex;
    flex-direction: row;

    .cover-container,
    .cover {
      width: 230px;
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
        margin-bottom: .4em;
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

  .modal-widget {
    padding: 10px 20px;
    flex-grow: 1;

    input[type=number],
    input[type=text],
    input[type=password] {
      @include heavy-input;
      width: 100%;
    }

    input[type=number] {
      &::-webkit-inner-spin-button,
      &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }

    strong {
      font-weight: bold;
    }

    p {
      line-height: 1.4;
      margin: 8px 0;
    }

    .json-tree-container {
      width: 100%;
      height: 350px;
      overflow-y: auto;
    }

    .prereqs-rows {
      display: flex;
      flex: 0 1;
      flex-direction: column;
      align-content: flex-start;
    }

    .prereqs-row {
      display: flex;
      flex: 0 1;
      flex-direction: row;
      align-items: center;
      margin: 14px 0;
      margin-left: 10px;

      .task-status {
        margin-top: 5px;
        font-size: 80%;
        color: $secondary-text-color;
      }
    }

    .clear-browsing-data-list {
      label {
        display: block;
        border-left: 3px solid $pref-border-color;
        padding: 5px 0;
        padding-left: 5px;
        margin: 3px 0;
        margin-bottom: 10px;
        transition: 0.2s border ease-in-out;

        &:hover {
          cursor: pointer;
        }

        &.active {
          border-color: $accent-color;
        }
      }

      .checkbox {
        margin: 0;
        display: flex;
        align-items: center;

        input[type=checkbox] {
          margin-right: 10px;
        }
      }

      .checkbox-info {
        margin: 0;
        margin-top: 5px;
        margin-left: 5px;
        font-size: 90%;
        color: $secondary-text-color;
      }
    }
  }

  .buttons {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 20px;

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

const BigButtonContent = styled.div`
  flex: 1 1;
  display: flex;
  flex-direction: column;
`;

const BigButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  margin: .3em .1em;
`;

const HeaderDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};
  padding: 8px;
  padding-left: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;

  .title {
    color: ${props => props.theme.secondaryText};
    font-size: ${props => props.theme.fontSizes.large};
  }

  .close-modal {
    font-size: 20px;
    ${styles.secondaryLink()};
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

interface IDefaultButtons {
  [key: string]: IModalButton;
  cancel: IModalButton;
}

const DEFAULT_BUTTONS = {
  cancel: {
    id: "modal-cancel",
    label: ["prompt.action.cancel"],
    action: actions.closeModal({}),
    className: "secondary",
  },
  ok: {
    id: "modal-ok",
    label: ["prompt.action.ok"],
    action: actions.closeModal({}),
    className: "secondary",
  },
} as IDefaultButtons;

@watching
export class Modal extends React.PureComponent<IProps & IDerivedProps, IState> {
  constructor() {
    super();
    this.state = {
      widgetPayload: null,
    };
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.trigger, async (store, action) => {
      if (action.payload.command === "ok") {
        const { modal } = this.props;
        if (!modal) {
          return;
        }

        const mainButton = (modal.bigButtons || modal.buttons || ea)[0];
        if (!mainButton) {
          return;
        }

        const onClick = this.buttonOnClick(this.specToButton(mainButton));
        onClick();
      }
    });
  }

  render() {
    const { modal, closeModal, intl } = this.props;

    if (modal) {
      const {
        bigButtons = [],
        buttons = [],
        stillCoverUrl,
        coverUrl,
        title = "",
        message = "",
        detail,
        widget,
      } = modal;

      return (
        <ReactModal isOpen contentLabel="Modal" style={customStyles}>
          <ModalDiv>
            <HeaderDiv>
              <span className="title">
                {format(title)}
              </span>
              <Filler />
              {modal.unclosable
                ? null
                : <IconButton icon="cross" onClick={() => closeModal({})} />}
            </HeaderDiv>

            {message !== ""
              ? <div className="body">
                  <div className="message">
                    <div>
                      <Markdown source={formatString(intl, message)} />
                    </div>
                    {detail &&
                      <div className="secondary">
                        <Markdown source={formatString(intl, detail)} />
                      </div>}
                  </div>
                </div>
              : null}

            {widget ? this.renderWidget(widget, modal) : null}

            {bigButtons.length > 0
              ? <div className="big-wrapper">
                  {stillCoverUrl || coverUrl
                    ? <div className="cover-container">
                        <HoverCover
                          className="cover"
                          coverUrl={coverUrl}
                          stillCoverUrl={stillCoverUrl}
                        />
                      </div>
                    : ""}
                  {this.renderButtons(bigButtons, "big")}
                </div>
              : null}

            {this.renderButtons(buttons, "normal")}
          </ModalDiv>
        </ReactModal>
      );
    } else {
      return <div />;
    }
  }

  renderButtons(buttons: IModalButtonSpec[], flavor: Flavor) {
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

  renderBigButtons(buttons: IModalButtonSpec[]) {
    return (
      <BigButtonsDiv>
        {map(buttons, (buttonSpec, index) => {
          const button = this.specToButton(buttonSpec);
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
                <BigButtonRow>
                  {format(label)}
                </BigButtonRow>

                {tags || timeAgo
                  ? <BigButtonRow>
                      {tags
                        ? map(tags, tag => {
                            return (
                              <Tag>
                                {tag.icon ? <Icon icon={tag.icon} /> : null}
                                {tag.label ? format(tag.label) : null}
                              </Tag>
                            );
                          })
                        : null}
                      {timeAgo
                        ? <Tag>
                            <TimeAgo date={timeAgo.date} />
                          </Tag>
                        : null}
                    </BigButtonRow>
                  : null}
              </BigButtonContent>
            </RowButton>
          );
        })}
      </BigButtonsDiv>
    );
  }

  renderNormalButtons(buttons: IModalButtonSpec[]) {
    return (
      <ButtonsDiv>
        <Filler />
        {map(buttons, (buttonSpec, index) => {
          const button = this.specToButton(buttonSpec);
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
              label={format(label)}
            />
          );
        })}
      </ButtonsDiv>
    );
  }

  specToButton(buttonSpec: IModalButtonSpec): IModalButton {
    let button: IModalButton;
    if (typeof buttonSpec === "string") {
      button = DEFAULT_BUTTONS[buttonSpec];
      if (!button) {
        button = {
          label: "?",
          action: actions.closeModal({}),
        };
      }
    } else {
      button = buttonSpec as IModalButton;
    }
    return button;
  }

  buttonOnClick(button: IModalButton): () => void {
    const { dispatch } = this.props;
    const { action, actionSource } = button;

    let onClick = () => dispatch(action);
    if (actionSource === "widget") {
      onClick = () => {
        dispatch(actions.modalResponse(this.state.widgetPayload));
      };
    }
    return onClick;
  }

  renderWidget(widget: string, modal: IModal): JSX.Element {
    // this is run in the context of `chrome.js`, so relative to `app`
    try {
      let module = require(`./modal-widgets/${widget}`);
      if (!module) {
        throw new Error("new export");
      }
      let Component = module.default as React.ComponentClass<IModalWidgetProps>;
      return <Component modal={modal} updatePayload={this.updatePayload} />;
    } catch (e) {
      return (
        <div>
          Missing widget: {widget} — ${e.message}
        </div>
      );
    }
  }

  updatePayload = (payload: IModalResponsePayload) => {
    this.setState({ widgetPayload: payload });
  };

  componentWillMount() {
    ReactModal.setAppElement("body");
  }
}

interface IProps {}

interface IDerivedProps {
  modal: IModal;

  closeModal: typeof actions.closeModal;
  dispatch: (action: IModalAction) => void;

  intl: InjectedIntl;
}

interface IState {
  widgetPayload?: IModalResponsePayload;
}

export default connect<IProps>(injectIntl(Modal), {
  state: createStructuredSelector({
    modal: state => state.modals[0],
  }),
  dispatch: (dispatch, props) => ({
    dispatch: (action: IModalAction) => {
      dispatch(actions.closeModal({ action }));
    },
    closeModal: () => dispatch(actions.closeModal({})),
  }),
});

const ea = [];
