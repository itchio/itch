
import {createAction} from "redux-actions";

import {
  START_ONBOARDING, IStartOnboardingPayload,
  EXIT_ONBOARDING, IExitOnboardingPayload,
} from "../constants/action-types";

export const startOnboarding = createAction<IStartOnboardingPayload>(START_ONBOARDING);
export const exitOnboarding = createAction<IExitOnboardingPayload>(EXIT_ONBOARDING);
