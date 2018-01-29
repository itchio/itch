import { IModalButton, IModalButtonSpec } from "../types/index";
import { actions } from "../actions";

interface IDefaultButtons {
  [key: string]: IModalButton;
  ok: IModalButton;
  cancel: IModalButton;
  nevermind: IModalButton;
}

const DEFAULT_BUTTONS = {
  cancel: {
    id: "modal-cancel",
    label: ["prompt.action.cancel"],
    action: actions.closeModal({}),
    className: "secondary",
  },
  nevermind: {
    id: "modal-cancel",
    label: ["prompt.action.nevermind"],
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

export function specToButton(buttonSpec: IModalButtonSpec): IModalButton {
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
