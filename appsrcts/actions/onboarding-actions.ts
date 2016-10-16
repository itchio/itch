
import {createAction} from "redux-actions";

import {
  START_ONBOARDING,
  EXIT_ONBOARDING,
} from "../constants/action-types";

export const startOnboarding = createAction(START_ONBOARDING);
export const exitOnboarding = createAction(EXIT_ONBOARDING);
