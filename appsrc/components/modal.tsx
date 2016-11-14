
import * as React from "react";
import * as invariant from "invariant";
import {connect} from "./connect";

import ReactModal = require("react-modal");
import GFM from "./gfm";

import colors from "../constants/colors";

import {closeModal} from "../actions";
import {map} from "underscore";

import {IState, IModal, IModalButtonSpec, IModalButton, IModalAction} from "../types";
import {ILocalizer} from "../localizer";
import {IAction, ICloseModalPayload} from "../constants/action-types";

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
    action: closeModal({}),
    className: "secondary",
  },
} as IDefaultButtons;

export class Modal extends React.Component<IModalProps, void> {
  render () {
    const {t, modals = [], closeModal, halloween} = this.props;

    const modal = modals[0];

    if (modal) {
      const {bigButtons = [], buttons = [], cover, title = "", message = "", detail} = modal;

      return <ReactModal isOpen style={customStyles}>
        <div className={`modal ${halloween ? "halloween" : ""}`}>
          <div className="header">
            <h2>{t.format(title)}</h2>
            <div className="filler"/>
            <span className="icon icon-cross close-modal" onClick={closeModal}/>
          </div>

          <div className="body">
            <div className="message">
              <div><GFM source={t.format(message)}/></div>
              {detail && <div className="secondary"><GFM source={t.format(detail)}/></div>}
            </div>
          </div>

          {bigButtons.length > 0
          ? <div className="big-wrapper">
            {cover
              ? <img className="cover" src={cover}/>
              : ""}
            {this.renderButtons(bigButtons, "big")}
          </div>
          : ""}

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

    const {t, dispatch} = this.props;

    return <div className={`buttons flavor-${flavor}`}>
      <div className="filler"/>
      {map(buttons, (buttonSpec, index) => {
        let button: IModalButton;
        if (typeof buttonSpec === "string") {
          button = DEFAULT_BUTTONS[buttonSpec];
          // TODO: do static type checking for default buttons instead
          invariant(button, "");
        } else {
          button = buttonSpec as IModalButton;
        }
        const {label, action, className = "", icon} = button;
        let onClick = () => dispatch(action);

        return <div className={`button ${className}`} key={index} onClick={onClick}>
        {icon ? <span className={`icon icon-${icon}`}/> : ""}
        {t.format(label)}
        </div>;
      })}
    </div>;
  }

  componentWillMount () {
    ReactModal.setAppElement("body");
  }
}

interface IModalProps {
  modals: IModal[];
  halloween: boolean;
  t: ILocalizer;

  closeModal(payload: ICloseModalPayload): void;
  dispatch(action: IModalAction): void;
}

const mapStateToProps = (state: IState) => ({
  modals: state.modals,
  halloween: state.status.bonuses.halloween,
});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void, props: IModalProps) => ({
  dispatch: (action: IModalAction) => {
    dispatch(closeModal({action}));
  },
  closeModal: () => dispatch(closeModal({})),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Modal);
