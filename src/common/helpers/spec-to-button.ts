import { IModalButton, IModalButtonSpec } from "../types/index";

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
    className: "secondary",
  },
  nevermind: {
    id: "modal-cancel",
    label: ["prompt.action.nevermind"],
    className: "secondary",
  },
  ok: {
    id: "modal-ok",
    label: ["prompt.action.ok"],
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
      };
    }
  } else {
    button = buttonSpec as IModalButton;
  }
  return button;
}
