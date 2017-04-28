
import * as React from "react";
import {connect, I18nProps} from "./connect";

import ReactModal = require("react-modal");
import Markdown from "./basics/markdown";

import colors from "../constants/colors";

import * as actions from "../actions";
import {map} from "underscore";

import {IModal, IModalButtonSpec, IModalButton, IModalAction} from "../types";
import {IModalResponsePayload} from "../constants/action-types";

import {IModalWidgetProps} from "./modal-widgets/modal-widget";

import watching, {Watcher} from "./watching";

type Flavor = "normal" | "big";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(7, 4, 4, 0.75)",
  },
  content: {
    top: "50%",
    left: "50%",
    minWidth: "50%",
    maxWidth: "70%",
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

interface IDefaultButtons {
  [key: string]: IModalButton;
  cancel: IModalButton;
}

const DEFAULT_BUTTONS = {
  cancel: {
    label: ["prompt.action.cancel"],
    action: actions.closeModal({}),
    className: "secondary",
  },
  ok: {
    label: ["prompt.action.ok"],
    action: actions.closeModal({}),
    className: "secondary",
  },
} as IDefaultButtons;

@watching
export class Modal extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {
      widgetPayload: null,
    };
    this.updatePayload = this.updatePayload.bind(this);
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.triggerOk, async (store, action) => {
      const modal = this.props.modals[0];
      if (!modal) {
        return;
      }

      const mainButton = (modal.bigButtons || modal.buttons || [])[0];
      if (!mainButton) {
        return;
      }

      const onClick = this.buttonOnClick(this.specToButton(mainButton));
      onClick();
    });
  }

  render () {
    const {t, modals = [], closeModal} = this.props;

    const modal = modals[0];

    if (modal) {
      const {bigButtons = [], buttons = [], cover, title = "", message = "", detail, widget} = modal;

      return <ReactModal isOpen contentLabel="Modal" style={customStyles}>
        <div className="modal">
          <div className="header">
            <h2>{t.format(title)}</h2>
            <div className="filler"/>
            {modal.unclosable
              ? null
              : <span className="icon icon-cross close-modal" onClick={() => closeModal({})}/>
            }
          </div>

          { message !== ""
          ? <div className="body">
            <div className="message">
              <div><Markdown source={t.format(message)}/></div>
              {detail && <div className="secondary"><Markdown source={t.format(detail)}/></div>}
            </div>
          </div>
          : null }
          
          {widget
          ? this.renderWidget(widget, modal)
          : null}

          {bigButtons.length > 0
          ? <div className="big-wrapper">
            {cover
              ? <img className="cover" src={cover}/>
              : ""}
            {this.renderButtons(bigButtons, "big")}
          </div>
          : null}

          {this.renderButtons(buttons, "normal")}
        </div>
      </ReactModal>;
    } else {
      return <div/>;
    }
  }

  renderButtons (buttons: IModalButtonSpec[], flavor: Flavor) {
    if (buttons.length === 0) {
      return null;
    }

    const {t} = this.props;

    return <div className={`buttons flavor-${flavor}`}>
      <div className="filler"/>
      {map(buttons, (buttonSpec, index) => {
        const button = this.specToButton(buttonSpec);
        const {label, className = "", icon, tags} = button;
        let onClick = this.buttonOnClick(button);

        return <div className={`button ${className}`} key={index} onClick={onClick}>
        {icon ? <span className={`icon icon-${icon}`}/> : null}
        {t.format(label)}
        {tags
          ? map(tags, (tag) => {
            return <span className="tag">{t.format(tag.label)}</span>;
          })
          : null
        }
        </div>;
      })}
    </div>;
  }

  specToButton (buttonSpec: IModalButtonSpec): IModalButton {
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

  buttonOnClick (button: IModalButton): () => void {
    const {dispatch} = this.props;
    const {action, actionSource} = button;

    let onClick = () => dispatch(action);
    if (actionSource === "widget") {
      onClick = () => {
        dispatch(actions.modalResponse(this.state.widgetPayload));
      };
    }
    return onClick;
  }

  renderWidget (widget: string, modal: IModal): JSX.Element {
    // this is run in the context of `chrome.js`, so relative to `app`
    try {
      let module = require(`./modal-widgets/${widget}`);
      if (!module) {
        throw new Error("new export");
      }
      let Component = module.default as React.ComponentClass<IModalWidgetProps>;
      return <Component modal={modal} updatePayload={this.updatePayload}/>;
    } catch (e) {
      return <div>Missing widget: {widget} — ${e.message}</div>;
    }
  }

  updatePayload (payload: IModalResponsePayload) {
    this.setState({widgetPayload: payload});
  }

  componentWillMount () {
    ReactModal.setAppElement("body");
  }
}

interface IProps {}

interface IDerivedProps {
  modals: IModal[];

  closeModal: typeof actions.closeModal;
  dispatch: (action: IModalAction) => void;
}

interface IState {
  widgetPayload?: IModalResponsePayload;
}

export default connect<IProps>(Modal, {
  state: (state) => ({
    modals: state.modals,
  }),
  dispatch: (dispatch, props) => ({
    dispatch: (action: IModalAction) => {
      dispatch(actions.closeModal({action}));
    },
    closeModal: () => dispatch(actions.closeModal({})),
  }),
});
