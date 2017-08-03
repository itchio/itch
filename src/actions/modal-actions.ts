import uuid from "../util/uuid";

import { createAction } from "redux-actions";

import {
  OPEN_MODAL,
  IOpenModalPayload,
  CLOSE_MODAL,
  ICloseModalPayload,
  MODAL_CLOSED,
  IModalClosedPayload,
  MODAL_RESPONSE,
  IModalResponsePayload,
  MODAL_NO_RESPONSE,
  IModalNoResponsePayload,
} from "../constants/action-types";

const internalOpenModal = createAction<IOpenModalPayload>(OPEN_MODAL);
export const openModal = (payload = {} as IOpenModalPayload) =>
  internalOpenModal({ ...payload, id: uuid() });
export const closeModal = createAction<ICloseModalPayload>(CLOSE_MODAL);
export const modalClosed = createAction<IModalClosedPayload>(MODAL_CLOSED);
export const modalResponse = createAction<IModalResponsePayload>(
  MODAL_RESPONSE,
);
export const modalNoResponse = createAction<IModalNoResponsePayload>(
  MODAL_NO_RESPONSE,
);
