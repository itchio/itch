import { createAction } from "redux-actions";

import { REFRESH_MENU, IRefreshMenuPayload } from "../constants/action-types";

export const refreshMenu = createAction<IRefreshMenuPayload>(REFRESH_MENU);
