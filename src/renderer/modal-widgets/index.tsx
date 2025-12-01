import { ModalWidgetProps } from "common/modals";
import modals from "renderer/modals";

import ClearBrowsingData from "renderer/modal-widgets/ClearBrowsingData";
import SwitchVersionCave from "renderer/modal-widgets/SwitchVersionCave";
import ExploreJson from "renderer/modal-widgets/ExploreJson";
import ManageCave from "renderer/modal-widgets/ManageCave";
import ManageGame from "renderer/modal-widgets/ManageGame";
import PlanInstall from "renderer/modal-widgets/PlanInstall";
import PrereqsState from "renderer/modal-widgets/PrereqsState";
import RecaptchaInput from "renderer/modal-widgets/RecaptchaInput";
import SendFeedback from "renderer/modal-widgets/SendFeedback";
import SecretSettings from "renderer/modal-widgets/SecretSettings";
import ShowError from "renderer/modal-widgets/ShowError";
import TwoFactorInput from "renderer/modal-widgets/TwoFactorInput";
import ConfirmQuit from "renderer/modal-widgets/ConfirmQuit";

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
