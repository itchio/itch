import { createAction } from "redux-actions";

import { MENU_CHANGED, IMenuChangedPayload } from "../constants/action-types";

export const menuChanged = createAction<IMenuChangedPayload>(MENU_CHANGED);
