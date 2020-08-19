import { modals, ModalWidgetProps } from "common/modals";

import Loadable from "react-loadable";
const ClearBrowsingData = Loadable({
  loader: () => import("renderer/modal-widgets/ClearBrowsingData"),
  loading: () => null,
});
const SwitchVersionCave = Loadable({
  loader: () => import("renderer/modal-widgets/SwitchVersionCave"),
  loading: () => null,
});
const ExploreJson = Loadable({
  loader: () => import("renderer/modal-widgets/ExploreJson"),
  loading: () => null,
});
const ManageCave = Loadable({
  loader: () => import("renderer/modal-widgets/ManageCave"),
  loading: () => null,
});
const ManageGame = Loadable({
  loader: () => import("renderer/modal-widgets/ManageGame"),
  loading: () => null,
});
const PlanInstall = Loadable({
  loader: () => import("renderer/modal-widgets/PlanInstall"),
  loading: () => null,
});
const PrereqsState = Loadable({
  loader: () => import("renderer/modal-widgets/PrereqsState"),
  loading: () => null,
});
const RecaptchaInput = Loadable({
  loader: () => import("renderer/modal-widgets/RecaptchaInput"),
  loading: () => null,
});
const SendFeedback = Loadable({
  loader: () => import("renderer/modal-widgets/SendFeedback"),
  loading: () => null,
});
const SecretSettings = Loadable({
  loader: () => import("renderer/modal-widgets/SecretSettings"),
  loading: () => null,
});
const ShowError = Loadable({
  loader: () => import("renderer/modal-widgets/ShowError"),
  loading: () => null,
});
const TwoFactorInput = Loadable({
  loader: () => import("renderer/modal-widgets/TwoFactorInput"),
  loading: () => null,
});
const ConfirmQuit = Loadable({
  loader: () => import("renderer/modal-widgets/ConfirmQuit"),
  loading: () => null,
});

type ModalRegistry = typeof modals;

type ModalWidgetRegistry = {
  [K in keyof ModalRegistry]: React.ComponentType<
    ModalWidgetProps<ModalRegistry[K]["params"], ModalRegistry[K]["response"]> &
      any
  >;
} & {
  [key: string]: React.ComponentType<any>;
};

export const modalWidgets: ModalWidgetRegistry = {
  clearBrowsingData: ClearBrowsingData,
  switchVersionCave: SwitchVersionCave,
  exploreJson: ExploreJson,
  manageCave: ManageCave,
  manageGame: ManageGame,
  planInstall: PlanInstall,
  prereqsState: PrereqsState,
  recaptchaInput: RecaptchaInput,
  sendFeedback: SendFeedback,
  secretSettings: SecretSettings,
  showError: ShowError,
  twoFactorInput: TwoFactorInput,
  confirmQuit: ConfirmQuit,

  // dummies
  adminWipeBlessing: null,
  pickManifestAction: null,
  pickUpload: null,
  sandboxBlessing: null,
  naked: null,
};
