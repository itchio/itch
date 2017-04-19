
import {IModal} from "../../types";
import {IModalResponsePayload} from "../../constants/action-types";

export interface IModalWidgetProps {
  modal: IModal;
  updatePayload: (payload: IModalResponsePayload) => void;
};
